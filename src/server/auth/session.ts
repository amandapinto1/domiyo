import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ROUTES } from "@/lib/routes";
import { getHouseholdMembership, getMembership } from "@/server/households";
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

/** A non-member gets the same answer as a missing resource (docs/ARCHITECTURE.md › Authorization). */
export const requireHouseholdMember = cache(async (householdId: string) => {
  const session = await requireSession();
  const membership = await getHouseholdMembership(session.user.id, householdId);
  if (!membership) notFound();
  return { userId: session.user.id, ...membership };
});
