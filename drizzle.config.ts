import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "drizzle-kit";

// Same precedence as Next.js: shell > .env.local > .env. Empty counts as unset: drizzle-kit preloads .env itself.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) process.env[key] ||= value;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
  strict: true,
});
