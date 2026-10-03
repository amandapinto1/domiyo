import { expect, type Browser, type Cookie, type Page } from "@playwright/test";
import postgres from "postgres";

export async function signIn(page: Page, user: { email: string; password: string }) {
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Signs in once and returns the session cookies, so a file does not hit the sign-in rate limit (3 per 10 s). */
export async function sessionCookies(
  browser: Browser,
  baseURL: string | undefined,
  user: { email: string; password: string },
): Promise<Cookie[]> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is not set.");
  const client = postgres(databaseUrl, { max: 1 });
  try {
    await client`delete from rate_limits`;
  } finally {
    await client.end();
  }

  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/login");
  await signIn(page, user);
  await expect(page).not.toHaveURL(/\/login/);
  const { cookies } = await context.storageState();
  await context.close();
  return cookies;
}
