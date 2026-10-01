"use server";

import { refresh } from "next/cache";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { deleteDeclinedInvitation } from "@/server/households";
import { invitationInputSchema, type ProfileActionResult } from "../_components/schemas";

export async function deleteDeclinedInvitationAction(input: unknown): Promise<ProfileActionResult> {
  await requireSession();
  const parsed = invitationInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Convite não encontrado." };
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    await deleteDeclinedInvitation(householdId, parsed.data.invitationId);
    refresh();
    return { ok: true };
  } catch {
    console.error("deleteDeclinedInvitationAction failed", { invitationId: parsed.data.invitationId });
    return { ok: false, message: "Não foi possível remover o convite. Tente de novo." };
  }
}
