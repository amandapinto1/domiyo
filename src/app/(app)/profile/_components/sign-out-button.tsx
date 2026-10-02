"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { FOCUS_RING } from "@/components/ui/styles";

/** "Sair": ends the session on the server and returns to the sign-in screen. */
export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace(ROUTES.signIn);
      router.refresh();
    }
  }

  const Icon = isPending ? LoaderCircle : LogOut;
  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      aria-busy={isPending}
      className={`flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-toggle px-5 text-body-small font-medium text-toggle-icon disabled:cursor-progress ${FOCUS_RING}`}
    >
      <Icon aria-hidden="true" className={`size-5 ${isPending ? "motion-safe:animate-spin" : ""}`} strokeWidth={1.75} />
      Sair
    </button>
  );
}
