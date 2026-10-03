import { expect, test, type Cookie, type Locator, type Page } from "@playwright/test";
import { E2E_PLANNER, E2E_PLANNER_PARTNER } from "./global-setup";
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

async function swipeDown(page: Page, target: Locator) {
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("The swipe target should be visible.");
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y + 140 }],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

async function swipeHorizontally(page: Page, target: Locator, deltaX: number) {
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("The week strip should be visible.");
  const client = await page.context().newCDPSession(page);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + deltaX, y }],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

test("Agenda shows the week and the agenda filter", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/^Semana de /).first()).toBeVisible();

  await page.getByRole("button", { name: /Agendas:/ }).click();
  const onlyAgenda = page.getByRole("checkbox", { name: E2E_PLANNER.name });
  await expect(onlyAgenda).toBeChecked();
  const partnerAgenda = page.getByRole("checkbox", { name: E2E_PLANNER_PARTNER.name });
  await partnerAgenda.click();
  await expect(partnerAgenda).not.toBeChecked();
  // The last selected agenda cannot be deselected (docs/PRD.md).
  await expect(onlyAgenda).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Próxima semana" }).click();
  await expect(page).toHaveURL(/\/agenda\?day=\d{4}-\d{2}-\d{2}&agendas=[\w-]+$/);
  await expect(page.getByText("Nenhum compromisso no dia selecionado").filter({ visible: true })).toBeVisible();
});

test("PDF import controls are hidden for a member without explicit permission", async ({ page, browser }, testInfo) => {
  await expect(page.locator('a[href^="/agenda/import"]')).toHaveCount(2);

  const partnerCookies = await sessionCookies(browser, testInfo.project.use.baseURL, E2E_PLANNER_PARTNER);
  await page.context().clearCookies();
  await page.context().addCookies(partnerCookies);
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
  await expect(page.locator('a[href^="/agenda/import"]')).toHaveCount(0);
});

test("mobile day strip swipes without changing selection until a day is clicked", async ({ page, isMobile }) => {
  test.skip(!isMobile, "day-strip swiping is mobile-only");

  const initialUrl = page.url();
  const week = page.getByRole("navigation", { name: "Dias da semana" });
  const firstVisibleHref = await week.locator('li:not([aria-hidden="true"]) a').first().getAttribute("href");
  const initialStart = new URL(firstVisibleHref!, initialUrl).searchParams.get("start");
  if (!initialStart) throw new Error("The centered day strip should expose its start date.");
  await swipeHorizontally(page, week, -140);
  await expect.poll(() => new URL(page.url()).searchParams.get("start")).toBeTruthy();
  const leftStart = new URL(page.url()).searchParams.get("start");
  expect(leftStart).not.toBe(initialStart);
  expect(new URL(page.url()).searchParams.has("day")).toBe(false);
  if (!leftStart) throw new Error("The left swipe should move the day strip.");

  await swipeHorizontally(page, week, 140);
  await expect
    .poll(() => {
      const currentStart = new URL(page.url()).searchParams.get("start") ?? initialStart;
      return Date.parse(`${currentStart}T00:00:00Z`);
    })
    .toBeLessThan(Date.parse(`${leftStart}T00:00:00Z`));
  expect(new URL(page.url()).searchParams.has("day")).toBe(false);

  const otherDay = week.locator('li:not([aria-hidden="true"]) a:not([aria-current="date"])').first();
  const otherDayHref = await otherDay.getAttribute("href");
  await otherDay.click();
  await expect(week.locator('a[aria-current="date"]')).toHaveAttribute("href", otherDayHref!);
  await expect(page).toHaveURL(/\/agenda\?day=\d{4}-\d{2}-\d{2}(?:&start=\d{4}-\d{2}-\d{2})?$/);
});

test("mobile agenda opens with the selected day centered", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the mobile day strip is hidden on desktop");
  const week = page.getByRole("navigation", { name: "Dias da semana" });
  await expect(week.getByRole("link")).toHaveCount(7);
  await expect(week.getByRole("link").nth(3)).toHaveAttribute("aria-current", "date");
});

test("desktop agenda keeps the week strip hidden", async ({ page, isMobile }) => {
  test.skip(isMobile, "the desktop agenda uses the week grid");
  await expect(page.locator('nav[aria-label="Dias da semana"]').first()).toBeHidden();
});

test("cronograma upload rejects a file without a PDF signature", async ({ page }) => {
  await page.goto("/agenda/import");
  await expect(page.getByRole("heading", { name: "Importar cronograma" })).toBeVisible();
  await page.getByLabel("PDF do cronograma").setInputFiles({
    name: "cronograma.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await page.getByRole("button", { name: "Enviar para leitura" }).click();
  await expect(page.getByText("O arquivo escolhido não é um PDF válido.")).toBeVisible();
});

test("swiping from an interactive field does not dismiss a mobile drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Novo item" }).first().click();
  const form = page.getByRole("dialog", { name: "Novo item" });
  await expect(form).toBeVisible();
  const closeControls = form.locator('button[aria-label="Fechar"]');
  await expect(closeControls).toHaveCount(2);
  await expect(closeControls.first()).toBeVisible();
  await expect(closeControls.nth(1)).toBeHidden();
  await swipeDown(page, form.getByLabel("Título"));
  await expect(form).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
});

test("mobile drawers and sheets close when swiped from inert content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole("button", { name: "Novo item" }).first().click();
  const form = page.getByRole("dialog", { name: "Novo item" });
  await expect(form).toBeVisible();
  await form.evaluate(async (dialog) => {
    await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
  });
  await swipeDown(page, form.getByRole("heading", { name: "Novo item" }));
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await page.getByRole("button", { name: "Novo item" }).first().click();
  const reopenedForm = page.getByRole("dialog", { name: "Novo item" });
  await reopenedForm.getByRole("button", { name: "Data" }).click();
  const datePicker = page.getByRole("dialog", { name: "Escolher data" });
  await expect(datePicker).toBeVisible();
  await swipeDown(page, datePicker.getByRole("heading", { name: "Escolher data" }));
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(datePicker).toHaveCount(0);
});

// These flows change data, so they run once (desktop) and in order.
test.describe.serial("agenda items", () => {
  test.skip(({ isMobile }) => isMobile, "stateful flow runs once");

  test("creates, shares, edits and deletes a manual item", async ({ page, browser }, testInfo) => {
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
    await form.getByRole("button", { name: /Agendas/ }).click();
    await form.getByRole("checkbox", { name: `Agenda de ${E2E_PLANNER_PARTNER.name}` }).check();
    await form.getByLabel("Título").click();
    await form.getByRole("button", { name: "Adicionar item" }).click();
    await expect(form).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /Plantão E2E/ }).first().click();
    const detail = page.getByRole("dialog", { name: "Plantão E2E" });
    await expect(detail).toHaveCSS("animation-name", "dialog-drawer-rise");
    await expect(detail).toHaveCSS("animation-duration", "0.82s");
    await expect(detail).toContainText("Criado manualmente");
    await expect(detail).toContainText("09:00 – 11:30");
    await expect(detail).toContainText("Hospital");
    await expect(detail.getByRole("img", { name: `${E2E_PLANNER.name} ${E2E_PLANNER.surname}` })).toBeVisible();
    await expect(detail.getByRole("img", { name: `${E2E_PLANNER_PARTNER.name} ${E2E_PLANNER_PARTNER.surname}` })).toBeVisible();
    await expect(detail).toContainText(`Agenda de ${E2E_PLANNER.name}, Agenda de ${E2E_PLANNER_PARTNER.name}`);
    const detailBounds = await detail.boundingBox();
    const titleBounds = await detail.getByRole("heading", { name: "Plantão E2E" }).boundingBox();
    const firstOwnerBounds = await detail.getByRole("img", { name: `${E2E_PLANNER.name} ${E2E_PLANNER.surname}` }).boundingBox();
    const secondOwnerBounds = await detail.getByRole("img", { name: `${E2E_PLANNER_PARTNER.name} ${E2E_PLANNER_PARTNER.surname}` }).boundingBox();
    if (!detailBounds || !titleBounds || !firstOwnerBounds || !secondOwnerBounds) throw new Error("The detail header should be visible.");
    expect(firstOwnerBounds.x).toBeGreaterThanOrEqual(detailBounds.x);
    expect(firstOwnerBounds.x + firstOwnerBounds.width).toBeLessThanOrEqual(detailBounds.x + detailBounds.width);
    expect(secondOwnerBounds.x + secondOwnerBounds.width).toBeLessThanOrEqual(detailBounds.x + detailBounds.width);
    expect(titleBounds.x + titleBounds.width).toBeLessThanOrEqual(firstOwnerBounds.x);
    const closeControls = detail.locator('button[aria-label="Fechar"]');
    await expect(closeControls).toHaveCount(2);
    await expect(closeControls.first()).toBeVisible();
    await expect(closeControls.nth(1)).toBeHidden();
    await detail.evaluate(async (dialog) => {
      await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
    });

    const handleBounds = await closeControls.first().boundingBox();
    if (!handleBounds) throw new Error("The dialog handle should be visible on mobile.");
    const handleX = handleBounds.x + handleBounds.width / 2;
    const handleY = handleBounds.y + handleBounds.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX, handleY + 140, { steps: 8 });
    await page.mouse.up();
    const closingDrawer = page.locator('dialog[open][data-closing="true"]');
    await expect(closingDrawer).toHaveCount(1);
    await expect(closingDrawer.getByRole("heading", { name: "Plantão E2E" })).toBeVisible();
    await expect(closingDrawer.getByRole("img", { name: `${E2E_PLANNER.name} ${E2E_PLANNER.surname}` })).toBeVisible();
    await expect(closingDrawer.getByRole("img", { name: `${E2E_PLANNER_PARTNER.name} ${E2E_PLANNER_PARTNER.surname}` })).toBeVisible();
    await expect(detail).toBeHidden();
    await page.getByRole("button", { name: /Plantão E2E/ }).first().click();

    await page.goto("/home");
    await expect(page.getByText("Plantão E2E")).toBeVisible();
    const partnerContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    await partnerContext.addCookies(await sessionCookies(browser, testInfo.project.use.baseURL, E2E_PLANNER_PARTNER));
    const partnerPage = await partnerContext.newPage();
    await partnerPage.goto("/home");
    await expect(partnerPage.getByText("Plantão E2E")).toBeVisible();
    await partnerContext.close();
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
