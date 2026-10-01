"use client";

import { Calendar, ChevronLeft, ChevronRight, House, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Logo, LogoSymbol } from "@/components/ui/logo";
import { ROUTES } from "@/lib/routes";

type Destination = { href: string; label: string; icon: LucideIcon };

const DESTINATIONS: Destination[] = [
  { href: ROUTES.home, label: "Início", icon: House },
  { href: ROUTES.agenda, label: "Agenda", icon: Calendar },
  { href: ROUTES.profile, label: "Perfil", icon: User },
];

// Tailwind `lg`: the sidebar starts expanded from here and collapsed below (docs/DESIGN_SYSTEM.md › Breakpoints).
const LARGE_SCREEN_QUERY = "(min-width: 64rem)";

function subscribeToLargeScreen(onChange: () => void) {
  const query = window.matchMedia(LARGE_SCREEN_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsLargeScreen() {
  return useSyncExternalStore(
    subscribeToLargeScreen,
    () => window.matchMedia(LARGE_SCREEN_QUERY).matches,
    () => true,
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Main navigation: floating bottom bar below `md`, collapsible sidebar from `md`. */
export function AppNavigation() {
  const pathname = usePathname();
  return (
    <>
      <Sidebar pathname={pathname} />
      <BottomBar pathname={pathname} />
    </>
  );
}

// "auto" follows the breakpoint until the user toggles; the choice is not persisted (open decision in docs/design/inicio).
type SidebarMode = "auto" | "collapsed" | "expanded";

// Full class strings per mode, so Tailwind can see them.
const SIDEBAR_WIDTH: Record<SidebarMode, string> = { auto: "w-26 lg:w-65", collapsed: "w-26", expanded: "w-65" };
const FULL_LOGO: Record<SidebarMode, string> = { auto: "hidden lg:block", collapsed: "hidden", expanded: "block" };
const SYMBOL_LOGO: Record<SidebarMode, string> = { auto: "lg:hidden", collapsed: "", expanded: "hidden" };
const ITEM_ALIGN: Record<SidebarMode, string> = {
  auto: "justify-center lg:justify-start",
  collapsed: "justify-center",
  expanded: "justify-start",
};
const ITEM_LABEL: Record<SidebarMode, string> = { auto: "sr-only lg:not-sr-only", collapsed: "sr-only", expanded: "" };
const TOGGLE_ALIGN: Record<SidebarMode, string> = {
  auto: "self-center lg:self-start",
  collapsed: "self-center",
  expanded: "self-start",
};
const COLLAPSE_ICON: Record<SidebarMode, string> = { auto: "hidden lg:block", collapsed: "hidden", expanded: "block" };
const EXPAND_ICON: Record<SidebarMode, string> = { auto: "lg:hidden", collapsed: "", expanded: "hidden" };

function Sidebar({ pathname }: { pathname: string }) {
  const [mode, setMode] = useState<SidebarMode>("auto");
  const isLargeScreen = useIsLargeScreen();
  const isCollapsed = mode === "auto" ? !isLargeScreen : mode === "collapsed";

  function handleToggle() {
    setMode(isCollapsed ? "expanded" : "collapsed");
  }

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white px-6 pt-9 pb-8 transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex dark:border-lavender-800 dark:bg-lavender-900 ${SIDEBAR_WIDTH[mode]}`}
    >
      <div className={`flex ${ITEM_ALIGN[mode]}`}>
        <Logo className={`h-9 w-auto ${FULL_LOGO[mode]}`} />
        <LogoSymbol className={`h-7 w-auto ${SYMBOL_LOGO[mode]}`} />
      </div>

      <nav aria-label="Navegação principal" className="mt-11">
        <ul className="flex flex-col gap-1">
          {DESTINATIONS.map(({ href, label, icon: Icon }) => {
            const isCurrent = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  title={isCollapsed ? label : undefined}
                  className={`flex h-12 items-center gap-3 rounded-md px-4 text-body-small font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${ITEM_ALIGN[mode]} ${
                    isCurrent
                      ? "bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900"
                      : "text-ink-600 hover:bg-lavender-100 dark:text-lavender-300 dark:hover:bg-lavender-800"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`size-6 shrink-0 ${isCurrent ? "text-lime-500 dark:text-lavender-900" : ""}`}
                    strokeWidth={1.75}
                  />
                  <span className={ITEM_LABEL[mode]}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={handleToggle}
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        className={`mt-auto grid size-10 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus dark:bg-lavender-800 dark:text-white ${TOGGLE_ALIGN[mode]}`}
      >
        <ChevronLeft aria-hidden="true" className={`size-5 ${COLLAPSE_ICON[mode]}`} strokeWidth={2} />
        <ChevronRight aria-hidden="true" className={`size-5 ${EXPAND_ICON[mode]}`} strokeWidth={2} />
      </button>
    </aside>
  );
}

function BottomBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-6 bottom-6 z-10 rounded-full bg-lavender-900 p-2 md:hidden dark:bg-lavender-100"
    >
      <ul className="flex items-center justify-between">
        {DESTINATIONS.map(({ href, label, icon: Icon }) => {
          const isCurrent = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex h-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 dark:focus-visible:outline-lavender-900 ${
                  isCurrent
                    ? "gap-2.5 bg-lime-500 px-5 text-lavender-900 dark:bg-lavender-900 dark:text-lime-500"
                    : "w-16 text-lavender-300 dark:text-lavender-700"
                }`}
              >
                <Icon aria-hidden="true" className="size-6 shrink-0" strokeWidth={1.75} />
                <span className={isCurrent ? "text-body-small font-medium" : "sr-only"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
