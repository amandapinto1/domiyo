import type { ReactNode } from "react";
import { AppNavigation } from "./_components/app-navigation";

// Shell of the signed-in area; each page still enforces session and membership itself.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-lavender-100 md:flex dark:bg-lavender-950">
      <AppNavigation />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
