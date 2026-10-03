import "server-only";
import { and, asc, eq, gte, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { agendaItemAgendas, agendaItems, agendas, userPhotos, users, type AgendaItemSource } from "@/db/schema";
import { decryptText, encryptText, reencryptBytea, reencryptText } from "@/server/crypto";

export type HouseholdAgenda = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerFirstName: string;
  ownerSurname: string;
  ownerPhotoUpdatedAt: Date | null;
};

export type AgendaItemRecord = {
  id: string;
  agendaId: string;
  agendaIds: string[];
  startsAt: Date;
  endsAt: Date;
  color: string;
  source: AgendaItemSource;
  title: string;
  type: string | null;
  location: string | null;
  teacher: string | null;
  content: string | null;
  tag: string | null;
};

export type AgendaItemInput = {
  startsAt: Date;
  endsAt: Date;
  title: string;
  type: string | null;
  location: string | null;
};

// Manual items have no PDF legend color; lavender.300 keeps ink.900 text readable (docs/DESIGN_SYSTEM.md).
export const MANUAL_ITEM_COLOR = "#B9B8E1";

const householdAgendaIds = (householdId: string) =>
  db.select({ id: agendas.id }).from(agendas).where(eq(agendas.householdId, householdId));

/** Every agenda of the household with its owner, oldest first. */
export async function listHouseholdAgendas(householdId: string): Promise<HouseholdAgenda[]> {
  return db
    .select({
      id: agendas.id,
      name: agendas.name,
      ownerUserId: agendas.ownerUserId,
      ownerFirstName: users.name,
      ownerSurname: users.surname,
      ownerPhotoUpdatedAt: userPhotos.updatedAt,
    })
    .from(agendas)
    .innerJoin(users, eq(users.id, agendas.ownerUserId))
    .leftJoin(userPhotos, eq(userPhotos.userId, agendas.ownerUserId))
    .where(eq(agendas.householdId, householdId))
    .orderBy(asc(agendas.createdAt));
}

const inRange = (householdId: string, agendaIds: string[], from: Date, to: Date) =>
  and(
    eq(agendas.householdId, householdId),
    or(inArray(agendaItems.agendaId, agendaIds), inArray(agendaItemAgendas.agendaId, agendaIds)),
    gte(agendaItems.startsAt, from),
    lt(agendaItems.startsAt, to),
  );

/** Items of the given household agendas that start in [from, to), decrypted, in start order. */
export async function listAgendaItems(
  householdId: string,
  agendaIds: string[],
  from: Date,
  to: Date,
): Promise<AgendaItemRecord[]> {
  if (agendaIds.length === 0) return [];
  const rows = await db
    .select({
      id: agendaItems.id,
      agendaId: agendaItems.agendaId,
      sharedAgendaId: agendaItemAgendas.agendaId,
      startsAt: agendaItems.startsAt,
      endsAt: agendaItems.endsAt,
      color: agendaItems.color,
      source: agendaItems.source,
      title: decryptText(agendaItems.title, agendaItems.keyVersion),
      type: decryptText(agendaItems.type, agendaItems.keyVersion),
      location: decryptText(agendaItems.location, agendaItems.keyVersion),
      teacher: decryptText(agendaItems.teacher, agendaItems.keyVersion),
      content: decryptText(agendaItems.content, agendaItems.keyVersion),
      tag: decryptText(agendaItems.tag, agendaItems.keyVersion),
    })
    .from(agendaItems)
    .innerJoin(agendas, eq(agendas.id, agendaItems.agendaId))
    .leftJoin(agendaItemAgendas, eq(agendaItemAgendas.agendaItemId, agendaItems.id))
    .where(inRange(householdId, agendaIds, from, to))
    .orderBy(asc(agendaItems.startsAt));
  const records = new Map<string, AgendaItemRecord>();
  for (const row of rows) {
    const record = records.get(row.id) ?? {
      id: row.id,
      agendaId: row.agendaId,
      agendaIds: [row.agendaId],
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      color: row.color,
      source: row.source,
      title: row.title ?? "",
      type: row.type,
      location: row.location,
      teacher: row.teacher,
      content: row.content,
      tag: row.tag,
    };
    if (row.sharedAgendaId && !record.agendaIds.includes(row.sharedAgendaId)) record.agendaIds.push(row.sharedAgendaId);
    records.set(row.id, record);
  }
  return [...records.values()];
}

/** Start instants only (plaintext), for the month calendar's "dia com eventos" dots. */
export async function listItemStarts(householdId: string, agendaIds: string[], from: Date, to: Date): Promise<Date[]> {
  if (agendaIds.length === 0) return [];
  const rows = await db
    .select({ startsAt: agendaItems.startsAt })
    .from(agendaItems)
    .innerJoin(agendas, eq(agendas.id, agendaItems.agendaId))
    .leftJoin(agendaItemAgendas, eq(agendaItemAgendas.agendaItemId, agendaItems.id))
    .where(inRange(householdId, agendaIds, from, to));
  return [...new Map(rows.map((row) => [row.startsAt.getTime(), row.startsAt])).values()];
}

/** Adds a manual item to one or more agendas of this household. */
export async function createAgendaItem(
  householdId: string,
  agendaIds: string[],
  input: AgendaItemInput,
): Promise<"created" | "agenda_not_found"> {
  const uniqueAgendaIds = [...new Set(agendaIds)];
  const householdAgendas = await db
    .select({ id: agendas.id })
    .from(agendas)
    .where(and(eq(agendas.householdId, householdId), inArray(agendas.id, uniqueAgendaIds)));
  if (uniqueAgendaIds.length === 0 || householdAgendas.length !== uniqueAgendaIds.length) return "agenda_not_found";

  const title = encryptText(input.title);
  await db.transaction(async (tx) => {
    const [item] = await tx.insert(agendaItems).values({
      agendaId: uniqueAgendaIds[0],
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      color: MANUAL_ITEM_COLOR,
      source: "manual",
      title: title.ciphertext,
      type: encryptText(input.type).ciphertext,
      location: encryptText(input.location).ciphertext,
      keyVersion: title.keyVersion,
    }).returning({ id: agendaItems.id });
    if (uniqueAgendaIds.length > 1) {
      await tx.insert(agendaItemAgendas).values(
        uniqueAgendaIds.slice(1).map((agendaId) => ({ agendaItemId: item.id, agendaId })),
      );
    }
  });
  return "created";
}

/** Edits an item of this household; an imported item is marked as edited, so a re-import asks before overwriting it. */
export async function updateAgendaItem(householdId: string, itemId: string, input: AgendaItemInput): Promise<boolean> {
  const title = encryptText(input.title);
  const updated = await db
    .update(agendaItems)
    .set({
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      title: title.ciphertext,
      type: encryptText(input.type).ciphertext,
      location: encryptText(input.location).ciphertext,
      teacher: reencryptText(agendaItems.teacher, agendaItems.keyVersion),
      content: reencryptText(agendaItems.content, agendaItems.keyVersion),
      tag: reencryptText(agendaItems.tag, agendaItems.keyVersion),
      notes: reencryptText(agendaItems.notes, agendaItems.keyVersion),
      importKey: reencryptBytea(agendaItems.importKey, agendaItems.keyVersion),
      keyVersion: title.keyVersion,
      editedManually: true,
    })
    .where(and(eq(agendaItems.id, itemId), inArray(agendaItems.agendaId, householdAgendaIds(householdId))))
    .returning({ id: agendaItems.id });
  return updated.length > 0;
}

export async function deleteAgendaItem(householdId: string, itemId: string): Promise<boolean> {
  const deleted = await db
    .delete(agendaItems)
    .where(and(eq(agendaItems.id, itemId), inArray(agendaItems.agendaId, householdAgendaIds(householdId))))
    .returning({ id: agendaItems.id });
  return deleted.length > 0;
}
