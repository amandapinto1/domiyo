"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { confirmCronogramaImport } from "@/server/cronograma";
import type { CronogramaConflict } from "@/server/cronograma/diff";

const inputSchema = z
  .object({
    householdId: z.uuid(),
    agendaId: z.uuid(),
    pendingId: z.uuid(),
    decisions: z.array(z.object({ itemId: z.uuid(), decision: z.enum(["keep", "apply", "remove"]) }).strict()).max(1500),
  })
  .strict();

export type ConfirmCronogramaActionResult =
  | { ok: true; added: number; changed: number; removed: number }
  | { ok: false; status: "review" | "unavailable" | "error"; conflicts?: CronogramaConflict[] };

export async function confirmCronogramaImportAction(input: unknown): Promise<ConfirmCronogramaActionResult> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, status: "error" };
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    const result = await confirmCronogramaImport({ ...parsed.data, householdId });
    if (result.status === "unavailable") return { ok: false, status: "unavailable" };
    if (result.status === "review") return { ok: false, status: "review", conflicts: result.conflicts };
    refresh();
    return { ok: true, added: result.added, changed: result.changed, removed: result.removed };
  } catch {
    console.error("cronograma.confirm.failed");
    return { ok: false, status: "error" };
  }
}