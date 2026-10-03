import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import postgres from "postgres";
import type { FullConfig } from "@playwright/test";

// Synthetic accounts, recreated on every run in the separate test database.
const PASSWORD = "senha-de-teste-123";
export const E2E_USER = { email: "e2e.amanda@example.com", password: PASSWORD, name: "Amanda", surname: "Teste" };
export const E2E_INVITER = { email: "e2e.andrea@example.com", password: PASSWORD, name: "Andréa", surname: "Costa" };
export const E2E_MEMBER = { email: "e2e.bia@example.com", password: PASSWORD, name: "Bia", surname: "Lima" };
export const E2E_NEWCOMER = { email: "e2e.carla@example.com", password: PASSWORD, name: "Carla", surname: "Souza" };
export const E2E_OWNER = { email: "e2e.olga@example.com", password: PASSWORD, name: "Olga", surname: "Ramos" };
export const E2E_PARTNER = { email: "e2e.paula@example.com", password: PASSWORD, name: "Paula", surname: "Dias" };
export const E2E_PLANNER = { email: "e2e.rita@example.com", password: PASSWORD, name: "Rita", surname: "Melo" };
export const E2E_PLANNER_PARTNER = { email: "e2e.sofia@example.com", password: PASSWORD, name: "Sofia", surname: "Alves" };

export default async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is not set (see .env.example).");

  const run = (args: string[], nodeEnv?: NodeJS.ProcessEnv["NODE_ENV"]) =>
    execFileSync(process.execPath, args, {
      env: { ...process.env, DATABASE_URL: databaseUrl, ...(nodeEnv ? { NODE_ENV: nodeEnv } : {}) },
      encoding: "utf8",
    }).trim();

  run([resolve("scripts/migrate.ts")]);
  const userCreateNodeEnv = process.env.NODE_ENV === undefined || process.env.NODE_ENV === "test"
    ? "development"
    : process.env.NODE_ENV;
  for (const user of [E2E_USER, E2E_INVITER, E2E_MEMBER, E2E_NEWCOMER, E2E_OWNER, E2E_PARTNER, E2E_PLANNER, E2E_PLANNER_PARTNER]) {
    run([
      "--env-file-if-exists=.env",
      "--env-file-if-exists=.env.local",
      "--conditions=react-server",
      resolve("scripts/create-user.ts"),
      user.email,
      user.password,
      user.name,
      user.surname,
    ], userCreateNodeEnv);
  }
  // Bia gets a household of her own; the invitation under test comes from Andréa's household.
  run(["--env-file-if-exists=.env", "--env-file-if-exists=.env.local", resolve("scripts/create-invitation.ts"), E2E_MEMBER.email, "Casa da Bia"]);
  // Olga's household is where the Perfil flows invite, remove and leave.
  run(["--env-file-if-exists=.env", "--env-file-if-exists=.env.local", resolve("scripts/create-invitation.ts"), E2E_OWNER.email, "Casa da Olga"]);
  // Rita's household is where the Agenda flows create, edit and delete items.
  run(["--env-file-if-exists=.env", "--env-file-if-exists=.env.local", resolve("scripts/create-invitation.ts"), E2E_PLANNER.email, "Casa da Rita"]);
  const client = postgres(databaseUrl, { max: 1 });
  try {
    const [planner] = await client`select id from users where email = ${E2E_PLANNER.email}`;
    const [partner] = await client`select id from users where email = ${E2E_PLANNER_PARTNER.email}`;
    const [membership] = await client`select household_id from household_members where user_id = ${planner.id}`;
    await client`update household_members set can_import_pdf = true where user_id = ${planner.id}`;
    await client`insert into household_members (household_id, user_id, role) values (${membership.household_id}, ${partner.id}, 'member')`;
    await client`insert into agendas (household_id, owner_user_id, name) values (${membership.household_id}, ${partner.id}, ${`Agenda de ${E2E_PLANNER_PARTNER.name}`})`;
  } finally {
    await client.end();
  }
  process.env.E2E_INVITE_PATH = run([
    "--env-file-if-exists=.env",
    "--env-file-if-exists=.env.local",
    resolve("scripts/create-invitation.ts"),
    E2E_INVITER.email,
    "Casa da Andréa",
  ]).split("\n").at(-1);

  // The dev server compiles routes on first request; warm the auth API so the first form submit is not slow.
  const baseURL = config.projects[0].use.baseURL;
  await fetch(`${baseURL}/api/auth/ok`);
}
