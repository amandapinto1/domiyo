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

test("Início greets the member and shows today's empty agenda", async ({ page, isMobile }) => {
  await expect(page.getByRole("heading", { name: `Olá, ${E2E_MEMBER.name}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agenda de hoje" })).toBeVisible();
  await expect(page.getByText("Nenhum compromisso no dia selecionado")).toBeVisible();
  await expect(page.getByText(/Importe um cronograma/)).toHaveCount(0);

  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Agenda" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Perfil" })).toBeVisible();

  if (isMobile) {
    const getIconVerticalCenters = () => navigation.locator("ul").evaluate((list) =>
      [...list.querySelectorAll(":scope > li")].map((item) => {
        const icon = item.querySelector("svg");
        if (!icon) throw new Error("Navigation link is missing its icon.");
        const iconBounds = icon.getBoundingClientRect();
        return iconBounds.top + iconBounds.height / 2;
      }),
    );
    const expectHitboxWidths = async () => {
      const widths = await navigation.locator("ul").evaluate((list) =>
        [...list.querySelectorAll(":scope > li")].map((item) => {
          const link = item.querySelector("a");
          if (!link) throw new Error("Navigation link is missing.");
          return {
            active: link.hasAttribute("aria-current"),
            link: link.getBoundingClientRect().toJSON(),
            slot: item.getBoundingClientRect().toJSON(),
          };
        }),
      );
      for (const item of widths) {
        if (item.active) {
          expect(item.link.width).toBeCloseTo(item.slot.width, 0);
          expect(item.link.x).toBeCloseTo(item.slot.x, 0);
          expect(item.link.width).toBeGreaterThan(50);
        } else {
          expect(item.link.width).toBeCloseTo(50, 0);
          expect(item.link.x + item.link.width / 2).toBeCloseTo(item.slot.x + item.slot.width / 2, 0);
        }
      }
    };
    const expectPillMatchesSelectedSlot = async () => {
      const geometry = await navigation.locator("ul").evaluate((list) => {
        const active = list.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
        const pill = list.querySelector<HTMLElement>(":scope > span");
        if (!active || !pill) throw new Error("Active navigation indicator is missing.");
        const listBounds = list.getBoundingClientRect();
        const activeBounds = active.getBoundingClientRect();
        return {
          activeLeft: activeBounds.left - listBounds.left,
          activeWidth: activeBounds.width,
          pillLeft: Number.parseFloat(pill.style.left),
          pillWidth: Number.parseFloat(pill.style.width),
        };
      });
      expect(geometry.pillLeft).toBeCloseTo(geometry.activeLeft, 0);
      expect(geometry.pillWidth).toBeCloseTo(geometry.activeWidth, 0);
    };
    const expectIconsVerticallyAligned = async () => {
      const centers = await getIconVerticalCenters();
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
    };
    const expectInactiveLabelsHidden = async () => {
      const displays = await navigation.locator("ul > li > a > [data-nav-label]").evaluateAll((labels) =>
        labels.map((label) => getComputedStyle(label).display),
      );
      expect(displays.filter((display) => display !== "none")).toHaveLength(1);
    };

    await expectIconsVerticallyAligned();
    await expectHitboxWidths();
    await expectInactiveLabelsHidden();
    await expectPillMatchesSelectedSlot();
    await navigation.getByRole("link", { name: "Perfil" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expectIconsVerticallyAligned();
    await expectHitboxWidths();
    await expectInactiveLabelsHidden();
    await expectPillMatchesSelectedSlot();
    await navigation.getByRole("link", { name: "Agenda" }).click();
    await expect(page).toHaveURL(/\/agenda$/);
    await expectIconsVerticallyAligned();
    await expectHitboxWidths();
    await expectInactiveLabelsHidden();
    await expectPillMatchesSelectedSlot();
  }
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
  await expect(page.getByText("Nenhum compromisso no dia selecionado")).toBeVisible();
});

test("an invalid day falls back to today", async ({ page }) => {
  await page.goto("/home?day=2026-02-30");
  await expect(page.getByText("Nenhum compromisso no dia selecionado")).toBeVisible();
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
