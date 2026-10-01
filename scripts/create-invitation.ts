// Creates a household invitation link for local development and e2e tests, until the Perfil screen
// that creates invitations exists. Gives the inviter a household first if needed.
// Usage: pnpm invite:create <inviterEmail> [householdName]
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/db/schema/auth.ts";
import { agendas, householdInvitations, householdMembers, households } from "../src/db/schema/households.ts";

// ponytail: invitation lifetime is not decided yet (docs/PRD.md); 7 days until it is.
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const [rawEmail, householdName = "Casa de teste"] = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") throw new Error("Refusing to run in production.");
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
if (!rawEmail) throw new Error("Usage: pnpm invite:create <inviterEmail> [householdName]");

const client = postgres(databaseUrl, { max: 1 });

try {
  const token = randomBytes(32).toString("base64url");
  await drizzle(client).transaction(async (tx) => {
    const [inviter] = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, rawEmail.trim().toLowerCase()));
    if (!inviter) throw new Error("Inviter not found; create it with pnpm user:create.");

    let [membership] = await tx
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(eq(householdMembers.userId, inviter.id));
    if (!membership) {
      const [household] = await tx.insert(households).values({ name: householdName }).returning({ id: households.id });
      await tx.insert(householdMembers).values({ householdId: household.id, userId: inviter.id });
      await tx.insert(agendas).values({ householdId: household.id, ownerUserId: inviter.id, name: `Agenda de ${inviter.name}` });
      membership = { householdId: household.id };
    }

    await tx.insert(householdInvitations).values({
      householdId: membership.householdId,
      invitedByUserId: inviter.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });
  });
  // Only the path is printed; the token itself is never stored.
  console.log(`/invite/${token}`);
} finally {
  await client.end();
}
