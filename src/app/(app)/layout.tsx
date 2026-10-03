import type { ReactNode } from "react";
import { AppNavigation } from "./_components/app-navigation";
import { PullToRefresh } from "./_components/pull-to-refresh";

// Shell of the signed-in area; each page still enforces session and membership itself.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-lavender-100 md:flex dark:bg-lavender-950">
      <AppNavigation />
      <PullToRefresh />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
