// Railway Infrastructure as Code. Apply with the Railway CLI: `railway config plan`, then `railway config apply`.
// Railway does not read this file on deploy; it reads the settings applied from it.
import { defineRailway, postgres, preserve, project, service } from "railway/iac";

const APP_URL = "https://domiyo.app";

export default defineRailway(() => {
  const db = postgres("postgres");

  const web = service("web", {
    build: "pnpm build",
    // Migrations run once per deploy, before the new version starts (docs/ARCHITECTURE.md > Deployment).
    preDeploy: "pnpm db:migrate:deploy",
    start: "pnpm start",
    healthcheck: "/login",
    domains: ["domiyo.app"],
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      APP_PUBLIC_URL: APP_URL,
      BETTER_AUTH_URL: APP_URL,
      APP_DEFAULT_TIME_ZONE: "America/Fortaleza",
      NEXT_TELEMETRY_DISABLED: "1",
      // Secrets are set in the Railway dashboard and never written here.
      BETTER_AUTH_SECRET: preserve(),
      EMAIL_TRANSPORT: preserve(),
      EMAIL_FROM_ADDRESS: preserve(),
      EMAIL_FROM_NAME: preserve(),
    },
  });

  const invitationCleanup = service("invitation-cleanup", {
    build: "pnpm build",
    start: "pnpm invitations:cleanup",
    cronSchedule: "0 * * * *",
    env: { DATABASE_URL: db.env.DATABASE_URL },
  });

  return project("domiyo", { resources: [web, invitationCleanup, db] });
});
