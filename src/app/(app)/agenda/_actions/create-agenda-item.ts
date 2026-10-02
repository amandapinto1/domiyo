"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { createAgendaItem } from "@/server/agendas";
import { agendaItemSchema, type AgendaActionResult } from "../_components/agenda-item-schema";
import { toItemInput, valueErrors } from "./item-input";

const inputSchema = z.object({ householdId: z.uuid(), agendaId: z.uuid(), values: agendaItemSchema });

export async function createAgendaItemAction(input: unknown): Promise<AgendaActionResult> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: valueErrors(parsed.error) };
  }
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    const result = await createAgendaItem(householdId, parsed.data.agendaId, toItemInput(parsed.data.values));
    if (result === "agenda_not_found") return { ok: false, message: "Essa agenda não está mais disponível." };
  } catch {
    console.error("createAgendaItemAction failed");
    return { ok: false, message: "Não foi possível adicionar o item. Tente de novo." };
  }
  refresh();
  return { ok: true };
}
