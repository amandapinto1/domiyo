import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { StyledComponentsRegistry } from "@/lib/styled-components-registry";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Domiyo",
  description: "Organize a rotina do household em um só lugar.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="pt-BR" data-theme={theme} className={roboto.variable}>
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
