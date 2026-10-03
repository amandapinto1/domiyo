export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark";

export function getThemeColor(theme: Theme): string {
  return theme === "dark" ? "#1f1326" : "#e4e3f2";
}

export function parseTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
