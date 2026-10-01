"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { linkClassName } from "@/components/ui/link";

export function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isPending={pending} pendingLabel="Entrando no household…">
      Aceitar convite
    </Button>
  );
}

export function DeclineButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={linkClassName}>
      Recusar convite
    </button>
  );
}
