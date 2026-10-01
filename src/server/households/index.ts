import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { agendas, householdInvitations, householdMembers, households, users } from "@/db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Membership = { householdId: string; role: string };
export type MemberIdentity = { id: string; firstName: string };
export type InvitationView = { householdName: string; inviterName: string; expiresAt: Date };

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  const code = (value: unknown) => (value as { code?: string } | undefined)?.code;
  return code(err) === UNIQUE_VIOLATION || code((err as { cause?: unknown } | undefined)?.cause) === UNIQUE_VIOLATION;
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const isOpenInvitation = (token: string) =>
  and(
    eq(householdInvitations.tokenHash, hashInvitationToken(token)),
    eq(householdInvitations.status, "pending"),
    gt(householdInvitations.expiresAt, new Date()),
  );

export async function getMembership(userId: string): Promise<Membership | null> {
  const [membership] = await db
    .select({ householdId: householdMembers.householdId, role: householdMembers.role })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1);
  return membership ?? null;
}

// Joining a household always creates the member's own agenda (docs/PRD.md).
async function addMember(tx: Transaction, householdId: string, member: MemberIdentity) {
  await tx.insert(householdMembers).values({ householdId, userId: member.id });
  await tx.insert(agendas).values({ householdId, ownerUserId: member.id, name: `Agenda de ${member.firstName}` });
}

/** Creates a household with the user as its first member. The unique user_id is the final one-household guard. */
export async function createHousehold(member: MemberIdentity, name: string): Promise<"created" | "already_member"> {
  try {
    await db.transaction(async (tx) => {
      const [household] = await tx.insert(households).values({ name }).returning({ id: households.id });
      await addMember(tx, household.id, member);
    });
    return "created";
  } catch (err) {
    if (isUniqueViolation(err)) return "already_member";
    throw err;
  }
}

/** Returns what the invitation screen may show, or null when the invitation is expired, used, revoked or unknown. */
export async function getOpenInvitation(token: string): Promise<InvitationView | null> {
  const [invitation] = await db
    .select({
      householdName: households.name,
      inviterFirstName: users.name,
      inviterSurname: users.surname,
      expiresAt: householdInvitations.expiresAt,
    })
    .from(householdInvitations)
    .innerJoin(households, eq(households.id, householdInvitations.householdId))
    .innerJoin(users, eq(users.id, householdInvitations.invitedByUserId))
    .where(isOpenInvitation(token))
    .limit(1);
  if (!invitation) return null;

  const { householdName, inviterFirstName, inviterSurname, expiresAt } = invitation;
  return { householdName, inviterName: `${inviterFirstName} ${inviterSurname}`.trim(), expiresAt };
}

export async function acceptInvitation(
  member: MemberIdentity,
  token: string,
): Promise<"accepted" | "unavailable" | "already_member"> {
  try {
    return await db.transaction(async (tx) => {
      const [invitation] = await tx
        .select({ id: householdInvitations.id, householdId: householdInvitations.householdId })
        .from(householdInvitations)
        .where(isOpenInvitation(token))
        .for("update")
        .limit(1);
      if (!invitation) return "unavailable";

      const [existing] = await tx
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(eq(householdMembers.userId, member.id))
        .limit(1);
      if (existing) return "already_member";

      await addMember(tx, invitation.householdId, member);
      await tx
        .update(householdInvitations)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(householdInvitations.id, invitation.id));
      return "accepted";
    });
  } catch (err) {
    if (isUniqueViolation(err)) return "already_member";
    throw err;
  }
}

/** Marks an open invitation as declined; the inviter only ever sees "Recusado", never a reason. */
export async function declineInvitation(token: string): Promise<void> {
  await db
    .update(householdInvitations)
    .set({ status: "declined", respondedAt: new Date() })
    .where(isOpenInvitation(token));
}
