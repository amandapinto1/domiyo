import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROUTES } from "@/lib/routes";
import { getMembership } from "@/server/households";
import { auth } from "./auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) redirect(ROUTES.signIn);
  return session;
});

/** MVP: the user's only household; without one, the first-access screen. */
export const requireCurrentMembership = cache(async () => {
  const session = await requireSession();
  const membership = await getMembership(session.user.id);
  if (!membership) redirect(ROUTES.welcome);
  return { userId: session.user.id, ...membership };
});
