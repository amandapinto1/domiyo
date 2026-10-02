import { and, isNotNull, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { householdInvitations } from "../src/db/schema/households.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

const client = postgres(databaseUrl, { max: 1 });
try {
  const expired = await drizzle(client)
    .update(householdInvitations)
    .set({ tokenHash: null })
    .where(and(isNotNull(householdInvitations.tokenHash), lte(householdInvitations.expiresAt, new Date())))
    .returning({ id: householdInvitations.id });
  console.log(`Cleared ${expired.length} expired invitation token hash(es).`);
} finally {
  await client.end();
}