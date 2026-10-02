import { and, isNotNull, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { householdInvitations } from "../src/db/schema/households.ts";
import { pendingAgendaImports } from "../src/db/schema/cronograms.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

const client = postgres(databaseUrl, { max: 1 });
try {
  const database = drizzle(client);
  const now = new Date();
  const expiredInvitations = await database
    .update(householdInvitations)
    .set({ tokenHash: null })
    .where(and(isNotNull(householdInvitations.tokenHash), lte(householdInvitations.expiresAt, now)))
    .returning({ id: householdInvitations.id });
  const expiredImports = await database
    .delete(pendingAgendaImports)
    .where(lte(pendingAgendaImports.expiresAt, now))
    .returning({ id: pendingAgendaImports.id });
  console.log(`Expired data cleanup: ${expiredInvitations.length} invitation token hash(es), ${expiredImports.length} pending import(s).`);
} finally {
  await client.end();
}