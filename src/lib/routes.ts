// Route URLs are in English (product owner, 2026-10-01); UI copy stays pt-BR.
export const ROUTES = {
  splash: "/",
  signIn: "/login",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  welcome: "/welcome",
  home: "/home",
  agenda: "/agenda",
  profile: "/profile",
  invite: (token: string) => `/invite/${encodeURIComponent(token)}`,
} as const;

/** Accepts only same-site relative paths, so `next` can never redirect off the app (open redirect). */
export function safeNextPath(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }
  return value;
}

/** Appends `?next=` when there is somewhere to return to. */
export function withNext(path: string, next: string | undefined): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
