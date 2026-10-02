"use server";

import { redirect } from "next/navigation";
import { ROUTES, withNext } from "@/lib/routes";
import { getSession } from "@/server/auth";
import { acceptInvitation, declineInvitation } from "@/server/households";
import { invitationTokenSchema } from "../_components/invitation-token";

export async function acceptInvitationAction(token: unknown): Promise<void> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) redirect(ROUTES.home);
  const invitePath = ROUTES.invite(parsed.data);

  const session = await getSession();
  if (!session) redirect(withNext(ROUTES.signUp, invitePath));

  let result: Awaited<ReturnType<typeof acceptInvitation>>;
  try {
    result = await acceptInvitation({ id: session.user.id, firstName: session.user.name }, parsed.data);
  } catch {
    console.error("acceptInvitationAction failed");
    redirect(invitePath);
  }
  // Anything but success re-renders the invitation, which then shows the right state.
  redirect(result === "accepted" ? ROUTES.home : invitePath);
}

export async function declineInvitationAction(token: unknown): Promise<void> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (parsed.success) {
    try {
      await declineInvitation(parsed.data);
    } catch {
      console.error("declineInvitationAction failed");
    }
  }
  redirect(ROUTES.home);
}
