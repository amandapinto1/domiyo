import { expect, test, type Cookie } from "@playwright/test";
import { E2E_MEMBER } from "./global-setup";
import { sessionCookies } from "./session";

let cookies: Cookie[] = [];

test.beforeAll(async ({ browser }, testInfo) => {
  cookies = await sessionCookies(browser, testInfo.project.use.baseURL, E2E_MEMBER);
});

test.beforeEach(async ({ page }) => {
  await page.context().addCookies(cookies);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/home$/);
});

test("Início greets the member and shows today's empty agenda", async ({ page }) => {
  await expect(page.getByRole("heading", { name: `Olá, ${E2E_MEMBER.name}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agenda de hoje" })).toBeVisible();
  await expect(page.getByText("Nenhum compromisso hoje.")).toBeVisible();

  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Agenda" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Perfil" })).toBeVisible();
});

test("the week strip selects another day", async ({ page }) => {
  const week = page.getByRole("navigation", { name: "Dias da semana" }).getByRole("link");
  await expect(week).toHaveCount(7);
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1);

  const currentIndex = await week.evaluateAll((links) =>
    links.findIndex((link) => link.getAttribute("aria-current") === "date"),
  );
  const otherDay = week.nth(currentIndex === 0 ? 1 : 0);
  await otherDay.click();
  await expect(page).toHaveURL(/\/home\?day=\d{4}-\d{2}-\d{2}$/);
  await expect(otherDay).toHaveAttribute("aria-current", "date");
  await expect(page.getByText("Nenhum compromisso neste dia.")).toBeVisible();
});

test("an invalid day falls back to today", async ({ page }) => {
  await page.goto("/home?day=2026-02-30");
  await expect(page.getByText("Nenhum compromisso hoje.")).toBeVisible();
});

test("the sidebar collapses to icons on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "the sidebar exists only from md");
  await page.setViewportSize({ width: 1440, height: 900 });

  const sidebar = page.getByRole("complementary");
  await expect(sidebar).toHaveCSS("width", "260px");
  // Keyboard, because the Next.js dev tools badge sits over the toggle's corner in `next dev`.
  await page.getByRole("button", { name: "Recolher menu" }).press("Enter");
  await expect(sidebar).toHaveCSS("width", "104px");
  await expect(sidebar.getByRole("link", { name: "Início" })).toHaveAttribute("title", "Início");
  await page.getByRole("button", { name: "Expandir menu" }).press("Enter");
  await expect(sidebar).toHaveCSS("width", "260px");
});
