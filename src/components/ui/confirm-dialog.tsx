"use client";

import { useId, useState, useTransition } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { Dialog } from "./dialog";
import { DANGER_PILL, OUTLINE_PILL } from "./styles";

export type ConfirmResult = { ok: true } | { ok: false; message: string };

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  /** Resolves with a result; an action that redirects may resolve with nothing. */
  onConfirm: () => Promise<ConfirmResult | void>;
};

/** Destructive confirmation ("Remover membro", "Excluir item"); Cancelar gets focus first. */
export function ConfirmDialog({ isOpen, onClose, title, description, confirmLabel, pendingLabel, onConfirm }: ConfirmDialogProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setError(null);
    onClose();
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (!result || result.ok) onClose();
      else setError(result.message);
    });
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      titleId={`${id}-title`}
      descriptionId={`${id}-description`}
      variant="alert"
    >
      <p id={`${id}-description`} className="mt-3 text-body text-text-secondary">
        {description}
      </p>
      {error ? (
        <div className="mt-4">
          <FormAlert message={error} />
        </div>
      ) : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" data-autofocus onClick={handleClose} disabled={isPending} className={OUTLINE_PILL}>
          Cancelar
        </button>
        <button type="button" onClick={handleConfirm} disabled={isPending} aria-busy={isPending} className={DANGER_PILL}>
          {isPending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
