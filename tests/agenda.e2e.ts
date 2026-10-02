import { expect, test, type Cookie } from "@playwright/test";
import { E2E_PLANNER } from "./global-setup";
import { sessionCookies } from "./session";

let cookies: Cookie[] = [];

test.beforeAll(async ({ browser }, testInfo) => {
  cookies = await sessionCookies(browser, testInfo.project.use.baseURL, E2E_PLANNER);
});

test.beforeEach(async ({ page }) => {
  await page.context().addCookies(cookies);
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
});

test("Agenda shows the week and the agenda filter", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/^Semana de /).first()).toBeVisible();

  await page.getByRole("button", { name: /Agendas:/ }).click();
  const onlyAgenda = page.getByRole("checkbox", { name: E2E_PLANNER.name });
  await expect(onlyAgenda).toBeChecked();
  // The last selected agenda cannot be deselected (docs/PRD.md).
  await expect(onlyAgenda).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Próxima semana" }).click();
  await expect(page).toHaveURL(/\/agenda\?day=\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByText("Nenhum compromisso no dia selecionado").filter({ visible: true })).toBeVisible();
});

// These flows change data, so they run once (desktop) and in order.
test.describe.serial("agenda items", () => {
  test.skip(({ isMobile }) => isMobile, "stateful flow runs once");

  test("creates, edits and deletes a manual item", async ({ page }) => {
    await page.getByRole("button", { name: "Novo item" }).first().click();
    const form = page.getByRole("dialog", { name: "Novo item" });
    await form.getByRole("button", { name: "Adicionar item" }).click();
    await expect(form.getByText("Dê um título ao item.")).toBeVisible();

    await form.getByLabel("Título").fill("Plantão E2E");
    await form.getByRole("button", { name: "Data" }).click();
    const calendar = page.getByRole("dialog", { name: "Escolher data" });
    await calendar.locator('[aria-current="date"]').click();
    await expect(calendar).toBeHidden();
    await expect(form).toBeVisible();
    await form.getByLabel("Início").fill("09:00");
    await form.getByLabel("Fim").fill("08:00");
    await form.getByRole("button", { name: "Adicionar item" }).click();
    await expect(form.getByText("O fim precisa ser depois do início.")).toBeVisible();

    await form.getByLabel("Fim").fill("11:30");
    await form.getByLabel("Local").fill("Hospital");
    await form.getByRole("button", { name: "Adicionar item" }).click();
    await expect(form).toBeHidden();

    await page.getByRole("button", { name: /Plantão E2E/ }).first().click();
    const detail = page.getByRole("dialog", { name: "Plantão E2E" });
    await expect(detail).toContainText("Criado manualmente");
    await expect(detail).toContainText("09:00 – 11:30");
    await expect(detail).toContainText("Hospital");

    await page.goto("/home");
    await expect(page.getByText("Plantão E2E")).toBeVisible();
    await page.goto("/agenda");

    await page.getByRole("button", { name: /Plantão E2E/ }).first().click();
    await page.getByRole("button", { name: "Editar item" }).click();
    const editForm = page.getByRole("dialog", { name: "Editar item" });
    await editForm.getByLabel("Título").fill("Plantão noturno E2E");
    await editForm.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(editForm).toBeHidden();
    await expect(page.getByRole("button", { name: /Plantão noturno E2E/ }).first()).toBeVisible();

    await page.getByRole("button", { name: /Plantão noturno E2E/ }).first().click();
    await page.getByRole("button", { name: "Editar item" }).click();
    await page.getByRole("button", { name: "Excluir item" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Excluir este item?" });
    await expect(confirm.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await confirm.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("button", { name: /Plantão noturno E2E/ })).toHaveCount(0);
  });

  test("creates an all-day item", async ({ page }) => {
    await page.getByRole("button", { name: "Novo item" }).first().click();
    const form = page.getByRole("dialog", { name: "Novo item" });
    await form.getByLabel("Título").fill("Feriado E2E");
    await form.getByLabel("O dia todo").check();
    await expect(form.getByLabel("Início")).toBeDisabled();
    await expect(form.getByLabel("Início")).toHaveValue("00:00");
    await expect(form.getByLabel("Fim")).toHaveValue("23:59");
    await form.getByRole("button", { name: "Adicionar item" }).click();
    await expect(form).toBeHidden();

    await page.getByRole("button", { name: /Feriado E2E/ }).first().click();
    await expect(page.getByRole("dialog", { name: "Feriado E2E" })).toContainText("00:00 – 23:59");
    await page.getByRole("button", { name: "Editar item" }).click();
    await expect(page.getByRole("dialog", { name: "Editar item" }).getByLabel("O dia todo")).toBeChecked();
    await page.getByRole("button", { name: "Excluir item" }).click();
    await page.getByRole("alertdialog", { name: "Excluir este item?" }).getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("button", { name: /Feriado E2E/ })).toHaveCount(0);
  });
});
