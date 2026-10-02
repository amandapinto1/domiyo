import { expect, test, type Cookie } from "@playwright/test";
import { E2E_MEMBER, E2E_OWNER, E2E_PARTNER } from "./global-setup";
import { sessionCookies, signIn } from "./session";

test("Perfil shows the account and the household", async ({ page }) => {
  await page.goto("/login?next=/profile");
  await signIn(page, E2E_MEMBER);
  await expect(page).toHaveURL(/\/profile$/);

  await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
  const account = page.getByRole("region", { name: "Sua conta" });
  await expect(account).toContainText(`${E2E_MEMBER.name} ${E2E_MEMBER.surname}`);
  await expect(account).toContainText(E2E_MEMBER.email);

  const household = page.getByRole("region", { name: "Meu household" });
  await expect(household.getByText("1 membro", { exact: true })).toBeVisible();
  await expect(household.getByRole("list", { name: "Membros" })).toContainText("Você · admin");
  await expect(household.getByText("Link de convite", { exact: true }).first()).toBeVisible();

  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

// These flows change data, so they run once (desktop) and in order.
test.describe.serial("household management", () => {
  test.skip(({ isMobile }) => isMobile, "stateful flow runs once");
  let ownerCookies: Cookie[] = [];

  test.beforeAll(async ({ browser }, testInfo) => {
    ownerCookies = await sessionCookies(browser, testInfo.project.use.baseURL, E2E_OWNER);
  });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies(ownerCookies);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
  });

  test("edits the name", async ({ page }) => {
    const account = page.getByRole("region", { name: "Sua conta" });
    await account.getByRole("button", { name: "Editar nome" }).click();
    await account.getByLabel("Sobrenome").fill("");
    await account.getByRole("button", { name: "Salvar" }).click();
    await expect(account.getByText("Informe seu sobrenome.")).toBeVisible();

    await account.getByLabel("Sobrenome").fill("Nova");
    await account.getByRole("button", { name: "Salvar" }).click();
    await expect(account).toContainText(`${E2E_OWNER.name} Nova`);
    await expect(account.getByRole("button", { name: "Editar nome" })).toBeFocused();
  });

  test("sends and cancels an e-mail invitation", async ({ page }) => {
    const email = "e2e.convidada@example.com";
    await page.getByRole("button", { name: "Adicionar membro" }).click();
    const dialog = page.getByRole("dialog", { name: "Convidar membro" });
    await expect(dialog.getByLabel("E-mail de quem vai entrar")).toBeFocused();

    await dialog.getByRole("button", { name: "Enviar convite" }).click();
    await expect(dialog.getByText("Informe o e-mail de quem vai entrar.")).toBeVisible();
    await dialog.getByLabel("E-mail de quem vai entrar").fill(email);
    await dialog.getByRole("button", { name: "Enviar convite" }).click();
    await expect(dialog.getByRole("status").filter({ hasText: `Convite enviado para ${email}.` })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const household = page.getByRole("region", { name: "Meu household" });
    await expect(household.getByText(email)).toBeVisible();
    await household.getByRole("button", { name: `Cancelar convite de ${email}` }).click();
    await expect(household.getByText(email)).toBeHidden();
  });

  test("changes the photo, which only the household can see", async ({ page, browser }, testInfo) => {
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Trocar foto" }).click();
    await (await chooser).setFiles("src/app/apple-icon.png");
    const dialog = page.getByRole("dialog", { name: "Ajustar foto" });
    await dialog.getByRole("button", { name: "Aumentar zoom" }).click();
    await dialog.getByRole("group", { name: /Posição da foto/ }).press("ArrowLeft");
    await dialog.getByRole("button", { name: "Confirmar" }).click();
    await expect(dialog).toBeHidden();

    const photo = page.locator('main img[src*="/photo"]').first();
    await expect(photo).toBeVisible();
    const photoPath = await photo.getAttribute("src");
    expect((await page.request.get(photoPath ?? "")).status()).toBe(200);

    // A member of another household gets the same answer as for a missing photo.
    const outsiderCookies = await sessionCookies(browser, testInfo.project.use.baseURL, E2E_MEMBER);
    const outsider = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    await outsider.addCookies(outsiderCookies);
    expect((await outsider.request.get(photoPath ?? "")).status()).toBe(404);
    await outsider.close();
  });

  test("an invitation link brings a member in, who can then be removed", async ({ page, browser }) => {
    await page.getByRole("button", { name: "Adicionar membro" }).click();
    const dialog = page.getByRole("dialog", { name: "Convidar membro" });
    await dialog.getByRole("button", { name: "Gerar link de convite" }).click();
    const link = await dialog.getByLabel("Ou compartilhe o link de convite").inputValue();
    expect(link).toMatch(/\/invite\/[\w-]+$/);
    expect(new URL(link).pathname.split("/").at(-1)).toMatch(/^[A-Za-z0-9]{8}$/);
    await dialog.getByRole("button", { name: "Fechar" }).last().click();

    const partnerContext = await browser.newContext();
    const partner = await partnerContext.newPage();
    await partner.goto(link);
    await partner.getByRole("button", { name: "Aceitar convite" }).click();
    await expect(partner).toHaveURL(/\/sign-up\?next=/);
    await partner.getByRole("link", { name: "Entre" }).click();
    await expect(partner).toHaveURL(/\/login\?next=/);
    await signIn(partner, E2E_PARTNER);
    await partner.getByRole("button", { name: "Aceitar convite" }).click();
    await expect(partner).toHaveURL(/\/home$/);
    await partnerContext.close();

    await page.reload();
    const household = page.getByRole("region", { name: "Meu household" });
    await expect(household.getByText("2 membros", { exact: true })).toBeVisible();
    await household.getByRole("button", { name: `Remover ${E2E_PARTNER.name}` }).click();
    const confirm = page.getByRole("alertdialog", { name: `Remover ${E2E_PARTNER.name} do household?` });
    await expect(confirm.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await confirm.getByRole("button", { name: "Remover" }).click();
    await expect(confirm).toBeHidden();
    await expect(household.getByText("1 membro", { exact: true })).toBeVisible();
  });

  test("the last member leaving deletes the household", async ({ page }) => {
    await page.getByRole("button", { name: "Sair do household" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Sair do household?" });
    await expect(confirm).toContainText("Você é o último membro");
    await confirm.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });
});
