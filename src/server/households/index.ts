import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gt, or } from "drizzle-orm";
import { db } from "@/db";
import {
  agendas,
  householdInvitations,
  householdMembers,
  households,
  userPhotos,
  users,
  type InvitationStatus,
} from "@/db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Membership = { householdId: string; role: string };
export type MemberIdentity = { id: string; firstName: string };
export type InvitationView = { householdName: string; inviterName: string; expiresAt: Date };
export type HouseholdMember = {
  memberId: string;
  userId: string;
  firstName: string;
  surname: string;
  role: string;
  /** Null when the member has no profile photo. */
  photoUpdatedAt: Date | null;
};
export type HouseholdOverview = { name: string; members: HouseholdMember[] };
export type SentInvitation = {
  id: string;
  /** Null for shareable link invitations. */
  email: string | null;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  respondedAt: Date | null;
  /** When the invitee created an account after the invitation but has not confirmed the email yet (docs/PRD.md). */
  inviteeSignedUpAt: Date | null;
};
export type CreatedInvitation = { invitationId: string; token: string; expiresAt: Date; householdName: string };

// ponytail: invitation lifetime is not decided yet (docs/PRD.md); 7 days until it is.
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Invitation creation is rate-limited per inviter (docs/CONVENTIONS.md › Security checklist).
const MAX_INVITATIONS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;
const INVITATION_TOKEN_BYTES = 32;

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

/** The user's membership in this specific household, or null when they are not a member. */
export async function getHouseholdMembership(userId: string, householdId: string): Promise<Membership | null> {
  const [membership] = await db
    .select({ householdId: householdMembers.householdId, role: householdMembers.role })
    .from(householdMembers)
    .where(and(eq(householdMembers.userId, userId), eq(householdMembers.householdId, householdId)))
    .limit(1);
  return membership ?? null;
}

// Joining a household always creates the member's own agenda (docs/PRD.md).
async function addMember(tx: Transaction, householdId: string, member: MemberIdentity, role = "member") {
  await tx.insert(householdMembers).values({ householdId, userId: member.id, role });
  await tx.insert(agendas).values({ householdId, ownerUserId: member.id, name: `Agenda de ${member.firstName}` });
}

/** Creates a household with the user as its first member. The unique user_id is the final one-household guard. */
export async function createHousehold(member: MemberIdentity, name: string): Promise<"created" | "already_member"> {
  try {
    await db.transaction(async (tx) => {
      const [household] = await tx.insert(households).values({ name }).returning({ id: households.id });
      // "admin" is only a label shown in Perfil for now; every member has the same permissions.
      await addMember(tx, household.id, member, "admin");
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

/** Household name and members, the caller's membership already verified. */
export async function getHouseholdOverview(householdId: string): Promise<HouseholdOverview | null> {
  const [household] = await db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);
  if (!household) return null;

  const members = await db
    .select({
      memberId: householdMembers.id,
      userId: householdMembers.userId,
      firstName: users.name,
      surname: users.surname,
      role: householdMembers.role,
      photoUpdatedAt: userPhotos.updatedAt,
    })
    .from(householdMembers)
    .innerJoin(users, eq(users.id, householdMembers.userId))
    .leftJoin(userPhotos, eq(userPhotos.userId, householdMembers.userId))
    .where(eq(householdMembers.householdId, householdId))
    .orderBy(asc(householdMembers.createdAt));
  return { name: household.name, members };
}

/** Open (pending, not expired) and declined invitations; accepted, revoked and expired ones are not listed. */
export async function getSentInvitations(householdId: string): Promise<SentInvitation[]> {
  const rows = await db
    .select({
      id: householdInvitations.id,
      email: householdInvitations.email,
      status: householdInvitations.status,
      createdAt: householdInvitations.createdAt,
      expiresAt: householdInvitations.expiresAt,
      respondedAt: householdInvitations.respondedAt,
      inviteeSignedUpAt: users.createdAt,
    })
    .from(householdInvitations)
    // Only accounts created after the invitation count, so older unconfirmed accounts are never revealed.
    .leftJoin(
      users,
      and(
        eq(users.email, householdInvitations.email),
        eq(users.emailVerified, false),
        gt(users.createdAt, householdInvitations.createdAt),
      ),
    )
    .where(
      and(
        eq(householdInvitations.householdId, householdId),
        or(
          eq(householdInvitations.status, "declined"),
          and(eq(householdInvitations.status, "pending"), gt(householdInvitations.expiresAt, new Date())),
        ),
      ),
    )
    .orderBy(desc(householdInvitations.createdAt));
  return rows.map((row) => ({ ...row, inviteeSignedUpAt: row.status === "pending" ? row.inviteeSignedUpAt : null }));
}

/**
 * Creates an email (or, with a null email, a shareable link) invitation. A new email invitation replaces the
 * pending one for the same address. Only the token hash is stored; the token is returned once.
 */
export async function createInvitation(
  inviter: { userId: string; householdId: string },
  email: string | null,
): Promise<CreatedInvitation | "rate_limited"> {
  return db.transaction(async (tx) => {
    const [{ recent }] = await tx
      .select({ recent: count() })
      .from(householdInvitations)
      .where(
        and(
          eq(householdInvitations.invitedByUserId, inviter.userId),
          gt(householdInvitations.createdAt, new Date(Date.now() - ONE_HOUR_MS)),
        ),
      );
    if (recent >= MAX_INVITATIONS_PER_HOUR) return "rate_limited";

    const [household] = await tx
      .select({ name: households.name })
      .from(households)
      .where(eq(households.id, inviter.householdId))
      .limit(1);

    if (email) {
      await tx
        .update(householdInvitations)
        .set({ status: "revoked" })
        .where(
          and(
            eq(householdInvitations.householdId, inviter.householdId),
            eq(householdInvitations.email, email),
            eq(householdInvitations.status, "pending"),
          ),
        );
    }

    const token = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const [invitation] = await tx
      .insert(householdInvitations)
      .values({
        householdId: inviter.householdId,
        invitedByUserId: inviter.userId,
        email,
        tokenHash: hashInvitationToken(token),
        expiresAt,
      })
      .returning({ id: householdInvitations.id });
    return { invitationId: invitation.id, token, expiresAt, householdName: household.name };
  });
}

/** Cancels a pending invitation of this household; its link stops working at once. */
export async function revokeInvitation(householdId: string, invitationId: string): Promise<boolean> {
  const revoked = await db
    .update(householdInvitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(householdInvitations.id, invitationId),
        eq(householdInvitations.householdId, householdId),
        eq(householdInvitations.status, "pending"),
      ),
    )
    .returning({ id: householdInvitations.id });
  return revoked.length > 0;
}

/** Removes a declined invitation from the household's list. */
export async function deleteDeclinedInvitation(householdId: string, invitationId: string): Promise<boolean> {
  const deleted = await db
    .delete(householdInvitations)
    .where(
      and(
        eq(householdInvitations.id, invitationId),
        eq(householdInvitations.householdId, householdId),
        eq(householdInvitations.status, "declined"),
      ),
    )
    .returning({ id: householdInvitations.id });
  return deleted.length > 0;
}

// Serializes leave/remove on one household, so the last member is always detected.
async function lockHousehold(tx: Transaction, householdId: string) {
  await tx.select({ id: households.id }).from(households).where(eq(households.id, householdId)).for("update");
}

// A departing member's agenda (and, through it, its items and PDF) is deleted with the membership (docs/PRD.md).
async function deleteMembership(tx: Transaction, householdId: string, userId: string) {
  await tx.delete(agendas).where(and(eq(agendas.householdId, householdId), eq(agendas.ownerUserId, userId)));
  await tx
    .delete(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)));
}

/** Removes another member of the household. Members leave through `leaveHousehold`, never through this. */
export async function removeMember(
  householdId: string,
  memberId: string,
  actingUserId: string,
): Promise<"removed" | "not_found"> {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const [member] = await tx
      .select({ userId: householdMembers.userId })
      .from(householdMembers)
      .where(and(eq(householdMembers.id, memberId), eq(householdMembers.householdId, householdId)))
      .limit(1);
    if (!member || member.userId === actingUserId) return "not_found";

    await deleteMembership(tx, householdId, member.userId);
    return "removed";
  });
}

/** The user leaves; when they were the last member, the household and all of its data are deleted for good. */
export async function leaveHousehold(
  userId: string,
  householdId: string,
): Promise<"left" | "household_deleted" | "not_member"> {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const [membership] = await tx
      .select({ id: householdMembers.id })
      .from(householdMembers)
      .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)))
      .limit(1);
    if (!membership) return "not_member";

    await deleteMembership(tx, householdId, userId);
    const [{ remaining }] = await tx
      .select({ remaining: count() })
      .from(householdMembers)
      .where(eq(householdMembers.householdId, householdId));
    if (remaining > 0) return "left";

    await tx.delete(households).where(eq(households.id, householdId));
    return "household_deleted";
  });
}
