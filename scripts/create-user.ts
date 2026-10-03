// Creates (or replaces) a verified email/password user for local development and e2e tests,
// skipping the email confirmation step. Usage: pnpm user:create <email> <password> <name> [surname]
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accounts, users } from "../src/db/schema/auth.ts";
import { hashPassword } from "../src/server/auth/password.ts";

const [rawEmail, password, name, surname = ""] = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV !== "development") throw new Error("This command is only available in development.");
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
if (!rawEmail || !password || !name) throw new Error("Usage: pnpm user:create <email> <password> <name> [surname]");

// Better Auth lowercases emails on sign-in.
const email = rawEmail.trim().toLowerCase();
const client = postgres(databaseUrl, { max: 1 });

try {
  const passwordHash = await hashPassword(password);
  await drizzle(client).transaction(async (tx) => {
    await tx.delete(users).where(eq(users.email, email));
    const [user] = await tx.insert(users).values({ name, surname, email, emailVerified: true }).returning({ id: users.id });
    await tx.insert(accounts).values({ userId: user.id, accountId: user.id, providerId: "credential", password: passwordHash });
  });
  console.log("User ready.");
} finally {
  await client.end();
}
