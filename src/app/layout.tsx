import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { StyledComponentsRegistry } from "@/lib/styled-components-registry";
import { getThemeColor, parseTheme, THEME_COOKIE } from "@/lib/theme";
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
  appleWebApp: { capable: true, title: "Domiyo", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return { themeColor: getThemeColor(theme), viewportFit: "cover" };
}

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
