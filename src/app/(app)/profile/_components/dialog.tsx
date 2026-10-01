"use client";

import { TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { FOCUS_RING } from "./styles";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  descriptionId?: string;
  /** "sheet": bottom sheet on mobile, centered with a close button from `md`. "alert": centered destructive confirmation. */
  variant: "sheet" | "alert";
  children: ReactNode;
};

const PANEL = {
  sheet: "mb-0 mt-auto w-full max-w-none rounded-t-xl md:m-auto md:w-[calc(100%-3rem)] md:max-w-120 md:rounded-xl",
  alert: "m-auto w-[calc(100%-3rem)] max-w-120 rounded-xl",
} as const;
// Padding lives on an inner element, so a click on the dialog element itself is always a backdrop click.
const CONTENT = { sheet: "px-6 pt-3 pb-8 md:p-8", alert: "p-6 md:p-8" } as const;

/**
 * Native modal dialog: focus moves inside, Escape and the backdrop close it, and focus returns to the trigger.
 * The element marked `data-autofocus` gets focus first.
 */
export function Dialog({ isOpen, onClose, title, titleId, descriptionId, variant, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      role={variant === "alert" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        // Escape goes through onClose, so the owner can keep the dialog open (e.g. while an action is pending).
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white p-0 text-text backdrop:bg-lavender-900/60 dark:bg-lavender-900 dark:[--app-input:var(--color-lavender-950)] ${PANEL[variant]}`}
    >
      <div className={CONTENT[variant]}>
        {variant === "sheet" ? (
          <>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className={`mx-auto mb-5 block h-6 w-16 cursor-pointer rounded-full md:hidden ${FOCUS_RING}`}
            >
              <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-lavender-300 dark:bg-lavender-600" />
            </button>
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-section-heading font-medium text-heading">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className={`hidden size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 md:grid dark:bg-lavender-800 dark:text-white ${FOCUS_RING}`}
              >
                <X aria-hidden="true" className="size-5" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-danger-100">
              <TriangleAlert className="size-6 text-danger-600" strokeWidth={1.75} />
            </span>
            <h2 id={titleId} className="mt-4 text-section-heading font-medium text-heading">
              {title}
            </h2>
          </>
        )}
        {isOpen ? children : null}
      </div>
    </dialog>
  );
}
