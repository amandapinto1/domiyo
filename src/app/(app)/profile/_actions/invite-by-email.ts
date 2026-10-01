"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { sendEmail } from "@/server/email";
import { householdInvitationMessage } from "@/server/email/templates";
import { createInvitation, revokeInvitation } from "@/server/households";
import { householdInputSchema, inviteEmailSchema, type ProfileActionResult } from "../_components/schemas";

const inputSchema = householdInputSchema.extend(inviteEmailSchema.shape);

export async function inviteByEmailAction(input: unknown): Promise<ProfileActionResult> {
  const session = await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const membership = await requireHouseholdMember(parsed.data.householdId);
  const { email } = parsed.data;

  try {
    const created = await createInvitation(membership, email);
    if (created === "rate_limited") {
      return { ok: false, message: "Você enviou muitos convites. Aguarde um pouco e tente de novo." };
    }
    const { name, surname } = session.user;
    try {
      await sendEmail(
        householdInvitationMessage(email, {
          inviterFirstName: name,
          inviterFullName: `${name} ${surname}`.trim(),
          householdName: created.householdName,
          url: `${process.env.APP_PUBLIC_URL ?? ""}${ROUTES.invite(created.token)}`,
          expiresAt: created.expiresAt,
        }),
      );
    } catch (err) {
      // An invitation nobody received must not stay usable.
      await revokeInvitation(membership.householdId, created.invitationId);
      throw err;
    }
  } catch {
    console.error("inviteByEmailAction failed");
    return { ok: false, message: "Não foi possível enviar o convite. Tente de novo." };
  }
  refresh();
  return { ok: true };
}
