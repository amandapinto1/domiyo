"use server";

import { refresh } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { createInvitation } from "@/server/households";
import { householdInputSchema } from "../_components/schemas";

export type CreateInvitationLinkResult =
  | { ok: true; invitationId: string; path: string }
  | { ok: false; message: string };

/** The token is returned only here, once; afterwards only its hash exists. */
export async function createInvitationLinkAction(input: unknown): Promise<CreateInvitationLinkResult> {
  await requireSession();
  const parsed = householdInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Não foi possível gerar o link. Tente de novo." };
  const membership = await requireHouseholdMember(parsed.data.householdId);

  try {
    const created = await createInvitation(membership, null);
    if (created === "rate_limited") {
      return { ok: false, message: "Você criou muitos convites. Aguarde um pouco e tente de novo." };
    }
    refresh();
    return { ok: true, invitationId: created.invitationId, path: ROUTES.invite(created.token) };
  } catch {
    console.error("createInvitationLinkAction failed");
    return { ok: false, message: "Não foi possível gerar o link. Tente de novo." };
  }
}
