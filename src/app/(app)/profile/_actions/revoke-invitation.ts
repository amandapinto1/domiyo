"use server";

import { refresh } from "next/cache";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { revokeInvitation } from "@/server/households";
import { invitationInputSchema, type ProfileActionResult } from "../_components/schemas";

export async function revokeInvitationAction(input: unknown): Promise<ProfileActionResult> {
  await requireSession();
  const parsed = invitationInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Convite não encontrado." };
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    const isRevoked = await revokeInvitation(householdId, parsed.data.invitationId);
    refresh();
    return isRevoked ? { ok: true } : { ok: false, message: "Este convite não está mais pendente." };
  } catch {
    console.error("revokeInvitationAction failed", { invitationId: parsed.data.invitationId });
    return { ok: false, message: "Não foi possível cancelar o convite. Tente de novo." };
  }
}
