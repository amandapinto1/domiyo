import { expect, test, type Page } from "@playwright/test";
import { E2E_MEMBER, E2E_NEWCOMER, E2E_USER } from "./global-setup";

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

const invitePath = () => {
  const path = process.env.E2E_INVITE_PATH;
  if (!path) throw new Error("E2E_INVITE_PATH was not set by global setup.");
  return path;
};

test("public entry redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("sign-up answers with the confirmation step", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page.getByText("Já tem uma conta?")).toBeVisible();
  await expect(page.getByText("Já tem um login?")).toBeHidden();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Informe seu nome.")).toBeVisible();

  await page.getByLabel("Nome", { exact: true }).fill("Dani");
  await page.getByLabel("Sobrenome").fill("Teste");
  await page.getByLabel("E-mail").fill(`e2e.signup.${Date.now()}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill("senha-nova-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("status")).toContainText("Enviamos um link de confirmação");
});

test("forgot password gives the same neutral answer", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail").fill("ninguem@example.com");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText("Se o e-mail estiver cadastrado");
});

test("a reset link without a valid token shows the expired screen", async ({ page }) => {
  await page.goto("/reset-password?error=INVALID_TOKEN");
  await expect(page.getByRole("heading", { name: "Link expirado" })).toBeVisible();
  await page.getByRole("link", { name: "Enviar novo link" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("an unknown invitation reveals nothing", async ({ page }) => {
  await page.goto("/invite/convite-que-nao-existe-123456");
  await expect(page.getByRole("heading", { name: "Convite indisponível" })).toBeVisible();
});

// These flows change data, so they run once (desktop) and in order.
test.describe.serial("household access", () => {
  test.skip(({ isMobile }) => isMobile, "stateful flow runs once");

  test("a member of another household cannot accept", async ({ page }) => {
    await page.goto(`/login?next=${encodeURIComponent(invitePath())}`);
    await signIn(page, E2E_MEMBER);
    await expect(page.getByRole("heading", { name: "Você já participa de um household" })).toBeVisible();
  });

  test("an invited person signs in from the invitation and joins", async ({ page }) => {
    await page.goto(invitePath());
    await expect(page.getByRole("heading", { name: "Você recebeu um convite" })).toBeVisible();
    await expect(page.getByText("Andréa Costa convidou você")).toBeVisible();

    await page.getByRole("button", { name: "Aceitar convite" }).click();
    await expect(page).toHaveURL(/\/sign-up\?next=/);
    await expect(page.getByText("Já tem um login?")).toBeVisible();
    await page.getByRole("link", { name: "Entre" }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByTestId("logo-splash")).toHaveCount(0);
    await signIn(page, E2E_USER);
    await expect(page.getByRole("heading", { name: "Você recebeu um convite" })).toBeVisible();
    await page.getByRole("button", { name: "Aceitar convite" }).click();
    await expect(page).toHaveURL(/\/home$/);

    await page.goto(invitePath());
    await expect(page.getByRole("heading", { name: "Convite indisponível" })).toBeVisible();
  });

  test("first access creates a household", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, E2E_NEWCOMER);
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { name: "Boas-vindas, Carla!" })).toBeVisible();

    await page.getByLabel("Nome do household").fill("Casa da Carla");
    await page.getByRole("button", { name: "Criar household" }).click();
    await expect(page).toHaveURL(/\/home$/);
  });
});
