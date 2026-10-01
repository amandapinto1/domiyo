import { expect, test } from "@playwright/test";
import { E2E_MEMBER } from "./global-setup";

test("the logo intro fades out to reveal the sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("logo-splash")).toBeVisible();
  await expect(page.getByTestId("logo-splash")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Que bom ter você de volta!" })).toBeVisible();
});

test.describe("sign-in form", () => {
  test("shows inline errors for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Informe seu e-mail.")).toBeVisible();
    await expect(page.getByText("Informe sua senha.")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeFocused();
  });

  test("rejects wrong credentials without revealing the account", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(E2E_MEMBER.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." })).toBeVisible();
  });

  test("signs in, keeps the session and skips the sign-in screen afterwards", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(E2E_MEMBER.email);
    await page.getByLabel("Senha", { exact: true }).fill(E2E_MEMBER.password);
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: "Você entrou no Domiyo." })).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/home$/);
  });

  test("protects the authenticated page", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login$/);
  });
});
