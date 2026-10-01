"use server";

import { refresh } from "next/cache";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { removeMember } from "@/server/households";
import { memberInputSchema, type ProfileActionResult } from "../_components/schemas";

export async function removeMemberAction(input: unknown): Promise<ProfileActionResult> {
  await requireSession();
  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Membro não encontrado." };
  const { householdId, userId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    const result = await removeMember(householdId, parsed.data.memberId, userId);
    refresh();
    return result === "removed" ? { ok: true } : { ok: false, message: "Essa pessoa não faz mais parte do household." };
  } catch {
    console.error("removeMemberAction failed", { memberId: parsed.data.memberId });
    return { ok: false, message: "Não foi possível remover. Tente de novo." };
  }
}
