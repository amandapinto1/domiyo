import { execSync } from "node:child_process";
import type { FullConfig } from "@playwright/test";

// Synthetic accounts, recreated on every run in the separate test database.
const PASSWORD = "senha-de-teste-123";
export const E2E_USER = { email: "e2e.amanda@example.com", password: PASSWORD, name: "Amanda", surname: "Teste" };
export const E2E_INVITER = { email: "e2e.andrea@example.com", password: PASSWORD, name: "Andréa", surname: "Costa" };
export const E2E_MEMBER = { email: "e2e.bia@example.com", password: PASSWORD, name: "Bia", surname: "Lima" };
export const E2E_NEWCOMER = { email: "e2e.carla@example.com", password: PASSWORD, name: "Carla", surname: "Souza" };
export const E2E_OWNER = { email: "e2e.olga@example.com", password: PASSWORD, name: "Olga", surname: "Ramos" };
export const E2E_PARTNER = { email: "e2e.paula@example.com", password: PASSWORD, name: "Paula", surname: "Dias" };

export default async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is not set (see .env.example).");

  const run = (command: string) =>
    execSync(command, { env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: "utf8" }).trim();

  run("pnpm -s db:migrate:deploy");
  for (const user of [E2E_USER, E2E_INVITER, E2E_MEMBER, E2E_NEWCOMER, E2E_OWNER, E2E_PARTNER]) {
    run(`pnpm -s user:create ${user.email} ${user.password} "${user.name}" "${user.surname}"`);
  }
  // Bia gets a household of her own; the invitation under test comes from Andréa's household.
  run(`pnpm -s invite:create ${E2E_MEMBER.email} "Casa da Bia"`);
  // Olga's household is where the Perfil flows invite, remove and leave.
  run(`pnpm -s invite:create ${E2E_OWNER.email} "Casa da Olga"`);
  process.env.E2E_INVITE_PATH = run(`pnpm -s invite:create ${E2E_INVITER.email} "Casa da Andréa"`).split("\n").at(-1);

  // The dev server compiles routes on first request; warm the auth API so the first form submit is not slow.
  const baseURL = config.projects[0].use.baseURL;
  await fetch(`${baseURL}/api/auth/ok`);
}
