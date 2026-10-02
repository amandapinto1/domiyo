"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { updateAgendaItem } from "@/server/agendas";
import { agendaItemSchema, type AgendaActionResult } from "../_components/agenda-item-schema";
import { toItemInput, valueErrors } from "./item-input";

const inputSchema = z.object({ householdId: z.uuid(), itemId: z.uuid(), values: agendaItemSchema });

export async function updateAgendaItemAction(input: unknown): Promise<AgendaActionResult> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: valueErrors(parsed.error) };
  }
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    const isUpdated = await updateAgendaItem(householdId, parsed.data.itemId, toItemInput(parsed.data.values));
    if (!isUpdated) return { ok: false, message: "Este item não existe mais." };
  } catch {
    console.error("updateAgendaItemAction failed", { itemId: parsed.data.itemId });
    return { ok: false, message: "Não foi possível salvar. Tente de novo." };
  }
  refresh();
  return { ok: true };
}
