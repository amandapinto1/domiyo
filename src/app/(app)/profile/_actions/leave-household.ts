"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { leaveHousehold } from "@/server/households";
import { householdInputSchema, type ProfileActionResult } from "../_components/schemas";

export async function leaveHouseholdAction(input: unknown): Promise<ProfileActionResult> {
  await requireSession();
  const parsed = householdInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Household não encontrado." };
  const { householdId, userId } = await requireHouseholdMember(parsed.data.householdId);

  try {
    await leaveHousehold(userId, householdId);
  } catch {
    console.error("leaveHouseholdAction failed");
    return { ok: false, message: "Não foi possível sair do household. Tente de novo." };
  }
  // Without a household, the user starts over at first access (docs/PRD.md).
  redirect(ROUTES.welcome);
}
