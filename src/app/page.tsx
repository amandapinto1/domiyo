import { cookies } from "next/headers";
import { Link } from "@/components/ui/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROUTES } from "@/lib/routes";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

export default async function EntryPage() {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <div className="relative min-h-dvh bg-lavender-100 dark:bg-lavender-950">
      <header className="absolute top-6 right-6 z-10 flex items-center gap-3 sm:top-10 sm:right-10">
        <Link
          href={ROUTES.signIn}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-lavender-900 px-5 text-white hover:bg-lavender-800 dark:bg-lime-500 dark:text-lavender-900 dark:hover:bg-lime-300"
        >
          Entrar
        </Link>
        <ThemeToggle initialTheme={theme} />
      </header>
      <main className="grid min-h-dvh place-items-center px-6" aria-label="Página inicial">
        <Logo className="h-auto w-64 max-w-full" />
      </main>
    </div>
  );
}
