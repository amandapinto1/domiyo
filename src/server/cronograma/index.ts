import "server-only";
import { and, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { agendaCronograms, agendaItems, agendas, pendingAgendaImports, rateLimits } from "@/db/schema";
import { APP_TIME_ZONE, calendarDateIn } from "@/lib/dates";
import { decryptBytea, decryptText, encryptBytea, encryptText } from "@/server/crypto";
import { diffCronograma, type CronogramaDiff, type ExistingCronogramaEvent } from "./diff";
import { getCronogramaInfoWithFilenameFallback } from "./filename-info";
import { pendingReadPhase, READ_STALE_MS } from "./read-phase";
import { cronogramaModelSchema, toCronogramaEvents, type CronogramaModel } from "./schema";
import { z } from "zod";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const PENDING_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const UPLOAD_LIMIT = 3;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const pendingScheduleSchema = z.object({ title: z.string(), firstYear: z.number().int(), model: cronogramaModelSchema }).strict();

export async function consumeCronogramaUpload(userId: string): Promise<boolean> {
  const now = Date.now();
  const windowExpired = sql`${rateLimits.lastRequest} <= ${now - UPLOAD_WINDOW_MS}`;
  const [limit] = await db
    .insert(rateLimits)
    .values({ key: `cronograma-upload:${userId}`, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${windowExpired} then 1 else ${rateLimits.count} + 1 end`,
        lastRequest: sql`case when ${windowExpired} then ${now} else ${rateLimits.lastRequest} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return Boolean(limit && limit.count <= UPLOAD_LIMIT);
}

export type ImportPreview = {
  pendingId: string;
  fileName: string;
  title: string;
  added: number;
  changed: number;
  removed: number;
  conflicts: CronogramaDiff["conflicts"];
};

export async function isAgendaInHousehold(householdId: string, agendaId: string): Promise<boolean> {
  const [agenda] = await db
    .select({ id: agendas.id })
    .from(agendas)
    .where(and(eq(agendas.id, agendaId), eq(agendas.householdId, householdId)))
    .limit(1);
  return Boolean(agenda);
}

async function existingEvents(tx: Transaction, agendaId: string, lock = false): Promise<ExistingCronogramaEvent[]> {
  const query = tx
    .select({
      id: agendaItems.id,
      startsAt: agendaItems.startsAt,
      endsAt: agendaItems.endsAt,
      color: agendaItems.color,
      title: decryptText(agendaItems.title, agendaItems.keyVersion),
      type: decryptText(agendaItems.type, agendaItems.keyVersion),
      location: decryptText(agendaItems.location, agendaItems.keyVersion),
      teacher: decryptText(agendaItems.teacher, agendaItems.keyVersion),
      content: decryptText(agendaItems.content, agendaItems.keyVersion),
      tag: decryptText(agendaItems.tag, agendaItems.keyVersion),
      sourceKey: decryptBytea(agendaItems.importKey, agendaItems.keyVersion),
      editedManually: agendaItems.editedManually,
    })
    .from(agendaItems)
    .where(and(eq(agendaItems.agendaId, agendaId), eq(agendaItems.source, "imported")));
  const rows = lock ? await query.for("update") : await query;

  return rows.flatMap((row): ExistingCronogramaEvent[] => {
    if (row.title === null) return [];
    return [{
      id: row.id,
      date: calendarDateIn(APP_TIME_ZONE, row.startsAt),
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      color: row.color,
      title: row.title,
      type: row.type,
      location: row.location,
      teacher: row.teacher,
      content: row.content,
      tag: row.tag,
      sourceKey: row.sourceKey?.toString("hex") ?? null,
      editedManually: row.editedManually,
    }];
  });
}

async function pendingImport(tx: Transaction, householdId: string, agendaId: string, lock = false) {
  const query = tx
    .select({
      id: pendingAgendaImports.id,
      pdf: decryptBytea(pendingAgendaImports.pdf, pendingAgendaImports.keyVersion),
      fileName: decryptText(pendingAgendaImports.fileName, pendingAgendaImports.keyVersion),
      schedule: decryptText(pendingAgendaImports.schedule, pendingAgendaImports.keyVersion),
      expiresAt: pendingAgendaImports.expiresAt,
    })
    .from(pendingAgendaImports)
    .innerJoin(agendas, eq(agendas.id, pendingAgendaImports.agendaId))
    .where(and(eq(agendas.householdId, householdId), eq(pendingAgendaImports.agendaId, agendaId)));
  const [row] = lock ? await query.for("update") : await query;
  if (!row) return null;
  if (row.expiresAt <= new Date()) {
    await tx.delete(pendingAgendaImports).where(eq(pendingAgendaImports.id, row.id));
    return null;
  }
  if (!row.schedule) return null;
  let schedule: unknown;
  try {
    schedule = JSON.parse(row.schedule);
  } catch {
    throw new Error("Importação pendente inválida.");
  }
  const parsed = pendingScheduleSchema.safeParse(schedule);
  if (!parsed.success) throw new Error("Importação pendente inválida.");
  return { ...row, fileName: row.fileName ?? "cronograma.pdf", schedule: parsed.data };
}

function makePreview(
  pending: NonNullable<Awaited<ReturnType<typeof pendingImport>>>,
  diff: CronogramaDiff,
): ImportPreview {
  return {
    pendingId: pending.id,
    fileName: pending.fileName,
    title: pending.schedule.title,
    added: diff.added.length,
    changed: diff.updated.length + diff.conflicts.filter((item) => item.kind === "changed").length,
    removed: diff.removedIds.length + diff.conflicts.filter((item) => item.kind === "removed").length,
    conflicts: diff.conflicts,
  };
}

export async function savePendingCronogramaImport(input: {
  householdId: string;
  agendaId: string;
  userId: string;
  pdf: Buffer;
  fileName: string;
}): Promise<string | null> {
  if (!(await isAgendaInHousehold(input.householdId, input.agendaId))) return null;
  const encryptedPdf = encryptBytea(input.pdf);
  const encryptedName = encryptText(input.fileName);
  const now = new Date();

  const [pending] = await db
    .insert(pendingAgendaImports)
    .values({
      agendaId: input.agendaId,
      uploadedByUserId: input.userId,
      pdf: encryptedPdf.ciphertext,
      fileName: encryptedName.ciphertext,
      schedule: null,
      failure: null,
      readFinishedAt: null,
      keyVersion: encryptedPdf.keyVersion,
      createdAt: now,
      expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
    })
    .onConflictDoUpdate({
      target: pendingAgendaImports.agendaId,
      set: {
        id: crypto.randomUUID(),
        uploadedByUserId: input.userId,
        pdf: encryptedPdf.ciphertext,
        fileName: encryptedName.ciphertext,
        schedule: null,
        failure: null,
        readFinishedAt: null,
        keyVersion: encryptedPdf.keyVersion,
        createdAt: now,
        expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
      },
    })
    .returning({ id: pendingAgendaImports.id });
  return pending?.id ?? null;
}

export async function completePendingCronogramaImport(input: {
  householdId: string;
  agendaId: string;
  pendingId: string;
  model: CronogramaModel;
}): Promise<boolean> {
  if (!(await isAgendaInHousehold(input.householdId, input.agendaId))) return false;
  const encryptedSchedule = encryptText(JSON.stringify({
    title: input.model.title,
    model: input.model,
    firstYear: new Date().getFullYear(),
  }));
  const [pending] = await db
    .update(pendingAgendaImports)
    .set({ schedule: encryptedSchedule.ciphertext, keyVersion: encryptedSchedule.keyVersion, readFinishedAt: new Date() })
    .where(and(
      eq(pendingAgendaImports.id, input.pendingId),
      eq(pendingAgendaImports.agendaId, input.agendaId),
    ))
    .returning({ id: pendingAgendaImports.id });
  return Boolean(pending);
}

export async function getCronogramaImportPreview(householdId: string, agendaId: string): Promise<ImportPreview | null> {
  return db.transaction(async (tx) => {
    const pending = await pendingImport(tx, householdId, agendaId);
    if (!pending) return null;
    const nextEvents = toCronogramaEvents(pending.schedule.model, pending.schedule.firstYear);
    return makePreview(pending, diffCronograma(await existingEvents(tx, agendaId), nextEvents));
  });
}

export type ImportReadState =
  | { status: "none" }
  | { status: "reading"; fileName: string; elapsedMs: number }
  | { status: "failed"; code: string }
  | { status: "ready"; preview: ImportPreview; readMs: number | null };

/** Records why the background read failed, only if this upload is still the pending one. */
export async function failPendingCronogramaImport(input: { agendaId: string; pendingId: string; code: string }): Promise<void> {
  await db
    .update(pendingAgendaImports)
    .set({ failure: input.code.slice(0, 40), readFinishedAt: new Date() })
    .where(and(eq(pendingAgendaImports.id, input.pendingId), eq(pendingAgendaImports.agendaId, input.agendaId)));
}

/** True while a background read for this agenda has no result yet and is not stale. */
export async function isCronogramaReadInProgress(householdId: string, agendaId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: pendingAgendaImports.id })
    .from(pendingAgendaImports)
    .innerJoin(agendas, eq(agendas.id, pendingAgendaImports.agendaId))
    .where(and(
      eq(agendas.householdId, householdId),
      eq(pendingAgendaImports.agendaId, agendaId),
      isNull(pendingAgendaImports.schedule),
      isNull(pendingAgendaImports.failure),
      gt(pendingAgendaImports.createdAt, new Date(Date.now() - READ_STALE_MS)),
      gt(pendingAgendaImports.expiresAt, new Date()),
    ))
    .limit(1);
  return Boolean(row);
}

/** What the import screen shows for this agenda: reading, failed, ready with a preview, or nothing. */
export async function getCronogramaImportState(householdId: string, agendaId: string): Promise<ImportReadState> {
  const [row] = await db
    .select({
      failure: pendingAgendaImports.failure,
      createdAt: pendingAgendaImports.createdAt,
      readFinishedAt: pendingAgendaImports.readFinishedAt,
      expiresAt: pendingAgendaImports.expiresAt,
      hasSchedule: sql<boolean>`${pendingAgendaImports.schedule} is not null`,
    })
    .from(pendingAgendaImports)
    .innerJoin(agendas, eq(agendas.id, pendingAgendaImports.agendaId))
    .where(and(eq(agendas.householdId, householdId), eq(pendingAgendaImports.agendaId, agendaId)))
    .limit(1);
  const phase = pendingReadPhase(row);
  if (phase.phase === "none") return { status: "none" };
  if (phase.phase === "failed") return { status: "failed", code: phase.code };
  if (phase.phase === "reading") {
    const [named] = await db
      .select({ fileName: decryptText(pendingAgendaImports.fileName, pendingAgendaImports.keyVersion) })
      .from(pendingAgendaImports)
      .where(eq(pendingAgendaImports.agendaId, agendaId))
      .limit(1);
    return { status: "reading", fileName: named?.fileName ?? "cronograma.pdf", elapsedMs: Math.max(0, Date.now() - (row?.createdAt.getTime() ?? Date.now())) };
  }
  const preview = await getCronogramaImportPreview(householdId, agendaId);
  return preview ? { status: "ready", preview, readMs: row?.readFinishedAt ? Math.max(0, row.readFinishedAt.getTime() - row.createdAt.getTime()) : null } : { status: "none" };
}

export type ImportDecision = { itemId: string; decision: "keep" | "apply" | "remove" };
export type ConfirmImportResult =
  | { status: "applied"; added: number; changed: number; removed: number }
  | { status: "review"; conflicts: CronogramaDiff["conflicts"] }
  | { status: "unavailable" };

export async function confirmCronogramaImport(input: {
  householdId: string;
  agendaId: string;
  pendingId: string;
  decisions: ImportDecision[];
}): Promise<ConfirmImportResult> {
  return db.transaction(async (tx) => {
    const [agenda] = await tx
      .select({ id: agendas.id })
      .from(agendas)
      .where(and(eq(agendas.id, input.agendaId), eq(agendas.householdId, input.householdId)))
      .for("update")
      .limit(1);
    if (!agenda) return { status: "unavailable" };

    const pending = await pendingImport(tx, input.householdId, input.agendaId, true);
    if (!pending || pending.id !== input.pendingId) return { status: "unavailable" };
    const nextEvents = toCronogramaEvents(pending.schedule.model, pending.schedule.firstYear);
    const diff = diffCronograma(await existingEvents(tx, input.agendaId, true), nextEvents);
    if (diff.conflicts.length > 0) {
      const decisions = new Map(input.decisions.map((item) => [item.itemId, item.decision]));
      const conflictIds = new Set(diff.conflicts.map((item) => item.itemId));
      if (
        decisions.size !== conflictIds.size ||
        [...conflictIds].some((id) => !decisions.has(id)) ||
        [...decisions.keys()].some((id) => !conflictIds.has(id)) ||
        diff.conflicts.some((item) => {
          const decision = decisions.get(item.itemId);
          return item.kind === "changed" ? decision !== "keep" && decision !== "apply" : decision !== "keep" && decision !== "remove";
        })
      ) {
        return { status: "review", conflicts: diff.conflicts };
      }
    } else if (input.decisions.length > 0) {
      return { status: "unavailable" };
    }

    const byConflictId = new Map(diff.conflicts.map((item) => [item.itemId, item]));
    let changed = diff.updated.length;
    const removedIds = [...diff.removedIds];

    for (const decision of input.decisions) {
      const conflict = byConflictId.get(decision.itemId);
      if (!conflict) continue;
      if (conflict.kind === "changed" && decision.decision === "apply" && conflict.proposedEvent) {
        await updateImportedEvent(tx, input.agendaId, conflict.itemId, conflict.proposedEvent);
        changed += 1;
      }
      if (conflict.kind === "removed" && decision.decision === "remove") removedIds.push(conflict.itemId);
    }

    for (const update of diff.updated) await updateImportedEvent(tx, input.agendaId, update.itemId, update.event);
    for (const event of diff.added) await insertImportedEvent(tx, input.agendaId, event);
    if (removedIds.length > 0) {
      await tx.delete(agendaItems).where(and(eq(agendaItems.agendaId, input.agendaId), inArray(agendaItems.id, removedIds)));
    }

    const encryptedPdf = encryptBytea(pending.pdf);
    const encryptedName = encryptText(pending.fileName);
    await tx
      .insert(agendaCronograms)
      .values({
        agendaId: input.agendaId,
        pdf: encryptedPdf.ciphertext,
        fileName: encryptedName.ciphertext,
        keyVersion: encryptedPdf.keyVersion,
        importedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: agendaCronograms.agendaId,
        set: {
          pdf: encryptedPdf.ciphertext,
          fileName: encryptedName.ciphertext,
          keyVersion: encryptedPdf.keyVersion,
          importedAt: new Date(),
        },
      });
    await tx.delete(pendingAgendaImports).where(eq(pendingAgendaImports.id, pending.id));

    return { status: "applied", added: diff.added.length, changed, removed: removedIds.length };
  });
}

async function insertImportedEvent(tx: Transaction, agendaId: string, event: ReturnType<typeof toCronogramaEvents>[number]) {
  const title = encryptText(event.title);
  await tx.insert(agendaItems).values({
    agendaId,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    color: event.color,
    source: "imported",
    editedManually: false,
    title: title.ciphertext,
    type: encryptText(event.type).ciphertext,
    location: encryptText(event.location).ciphertext,
    teacher: encryptText(event.teacher).ciphertext,
    content: encryptText(event.content).ciphertext,
    tag: encryptText(event.tag).ciphertext,
    importKey: encryptBytea(Buffer.from(event.sourceKey, "hex")).ciphertext,
    keyVersion: title.keyVersion,
  });
}

async function updateImportedEvent(
  tx: Transaction,
  agendaId: string,
  itemId: string,
  event: ReturnType<typeof toCronogramaEvents>[number],
) {
  const title = encryptText(event.title);
  await tx
    .update(agendaItems)
    .set({
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      color: event.color,
      title: title.ciphertext,
      type: encryptText(event.type).ciphertext,
      location: encryptText(event.location).ciphertext,
      teacher: encryptText(event.teacher).ciphertext,
      content: encryptText(event.content).ciphertext,
      tag: encryptText(event.tag).ciphertext,
      importKey: encryptBytea(Buffer.from(event.sourceKey, "hex")).ciphertext,
      keyVersion: title.keyVersion,
    })
    .where(and(eq(agendaItems.id, itemId), eq(agendaItems.agendaId, agendaId), eq(agendaItems.source, "imported")));
}

export async function getStoredCronograma(householdId: string, agendaId: string) {
  const [record] = await db
    .select({
      pdf: decryptBytea(agendaCronograms.pdf, agendaCronograms.keyVersion),
      fileName: decryptText(agendaCronograms.fileName, agendaCronograms.keyVersion),
    })
    .from(agendaCronograms)
    .innerJoin(agendas, eq(agendas.id, agendaCronograms.agendaId))
    .where(and(eq(agendas.householdId, householdId), eq(agendaCronograms.agendaId, agendaId)))
    .limit(1);
  return record?.pdf ? { pdf: record.pdf, fileName: record.fileName ?? "cronograma.pdf" } : null;
}

export async function getCurrentCronogramaInfo(householdId: string, agendaId: string) {
  const condition = and(eq(agendas.householdId, householdId), eq(agendaCronograms.agendaId, agendaId));
  return getCronogramaInfoWithFilenameFallback(
    async () => {
    const [record] = await db
      .select({ fileName: decryptText(agendaCronograms.fileName, agendaCronograms.keyVersion), importedAt: agendaCronograms.importedAt })
      .from(agendaCronograms)
      .innerJoin(agendas, eq(agendas.id, agendaCronograms.agendaId))
      .where(condition)
      .limit(1);
      return record ?? null;
    },
    async () => {
    const [record] = await db
      .select({ importedAt: agendaCronograms.importedAt })
      .from(agendaCronograms)
      .innerJoin(agendas, eq(agendas.id, agendaCronograms.agendaId))
      .where(condition)
      .limit(1);
      return record?.importedAt ?? null;
    },
    () => console.error("cronograma.filename.decrypt.failed"),
  );
}