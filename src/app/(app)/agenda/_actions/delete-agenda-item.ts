"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { deleteAgendaItem } from "@/server/agendas";
import type { AgendaActionResult } from "../_components/agenda-item-schema";

const inputSchema = z.object({ householdId: z.uuid(), itemId: z.uuid() });

export async function deleteAgendaItemAction(input: unknown): Promise<AgendaActionResult> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Item não encontrado." };
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    await deleteAgendaItem(householdId, parsed.data.itemId);
  } catch {
    console.error("deleteAgendaItemAction failed", { itemId: parsed.data.itemId });
    return { ok: false, message: "Não foi possível excluir o item. Tente de novo." };
  }
  refresh();
  return { ok: true };
}
