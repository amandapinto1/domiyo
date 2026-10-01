"use client";

import { useState } from "react";
import { linkClassName } from "@/components/ui/link";

// ponytail: no "join with invite code" screen is designed; this explains that the invite link itself is the way in.
export function InviteHint() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" aria-expanded={isOpen} className={linkClassName} onClick={() => setIsOpen(!isOpen)}>
        Entrar com convite
      </button>
      {isOpen ? (
        <span role="status" className="mt-2 block">
          Abra o link de convite que você recebeu por e-mail ou mensagem. Ele leva você direto para o household.
        </span>
      ) : null}
    </>
  );
}
