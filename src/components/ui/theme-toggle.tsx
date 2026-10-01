"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type ThemeToggleProps = { initialTheme: Theme; className?: string };

export function ThemeToggle({ initialTheme, className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState(initialTheme);
  const isDark = theme === "dark";

  function handleClick() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.cookie = `${THEME_COOKIE}=${nextTheme}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
    setTheme(nextTheme);
  }

  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
      className={`grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-toggle text-toggle-icon transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95 motion-reduce:transition-none ${className}`}
    >
      <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
    </button>
  );
}
