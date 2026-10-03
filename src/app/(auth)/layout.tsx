import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

// Shared shell for the access screens: gradient (light) / lavender.900 (dark), logo and theme toggle.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <div className="min-h-dvh bg-linear-to-b from-lavender-500 to-lavender-300 dark:bg-none dark:bg-lavender-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-122 flex-col px-6 pt-[calc(4rem_+_env(safe-area-inset-top))] pb-[calc(2.5rem_+_env(safe-area-inset-bottom))] md:justify-center md:py-16">
        <header className="flex items-center justify-between">
          <Logo className="h-11.25 w-auto" />
          <ThemeToggle initialTheme={theme} className="md:absolute md:top-10 md:right-10" />
        </header>
        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
