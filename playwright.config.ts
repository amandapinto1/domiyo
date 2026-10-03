import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";

// Same precedence as Next.js: shell > .env.local > .env.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) process.env[key] ||= value;
}

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// E2E runs against the separate test database (TEST_DATABASE_URL), never the dev one.
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  // Tests share synthetic accounts in one database, so they run one at a time.
  workers: 1,
  // The dev server compiles routes on first visit.
  expect: { timeout: 20_000 },
  timeout: 60_000,
  use: { baseURL: BASE_URL, locale: "pt-BR", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      BETTER_AUTH_URL: BASE_URL,
      APP_PUBLIC_URL: BASE_URL,
    },
  },
});
