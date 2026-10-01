// Applies pending drizzle/ migrations. Runs as Railway's pre-deploy step (see .railway/railway.ts),
// using drizzle-orm (a runtime dependency) so it works in the production image.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
} finally {
  await client.end();
}
