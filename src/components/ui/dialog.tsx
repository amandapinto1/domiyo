"use client";

import { TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { FOCUS_RING } from "./styles";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  descriptionId?: string;
  /**
   * "sheet": bottom sheet on mobile, centered with a close button from `md`. "drawer": bottom sheet on mobile,
   * full-height right panel from `md`. "alert": centered destructive confirmation. "modal": centered, title only.
   */
  variant: "sheet" | "drawer" | "alert" | "modal";
  /** "#RRGGBB" dot before the title, e.g. an agenda item's subject color. */
  titleColor?: string;
  /** Optional mobile-only action beside the title, used instead of the drawer close button. */
  mobileHeaderAction?: ReactNode;
  children: ReactNode;
};

const PANEL = {
  sheet: "mb-0 mt-auto w-full max-w-none rounded-t-xl md:m-auto md:w-[calc(100%-3rem)] md:max-w-120 md:rounded-xl",
  drawer:
    "mb-0 mt-auto w-full max-w-none rounded-t-xl md:my-0 md:mr-0 md:ml-auto md:h-dvh md:max-h-dvh md:w-110 md:rounded-l-xl md:rounded-r-none",
  alert: "m-auto w-[calc(100%-3rem)] max-w-120 rounded-xl",
  modal: "m-auto w-[calc(100%-3rem)] max-w-120 rounded-xl",
} as const;
// Padding lives on an inner element, so a click on the dialog element itself is always a backdrop click.
const CONTENT = {
  sheet: "px-6 pt-3 pb-8 md:p-8",
  drawer: "px-6 pt-3 pb-8 md:p-8",
  alert: "p-6 md:p-8",
  modal: "p-6 md:p-8",
} as const;
const DRAG_CLOSE_THRESHOLD = 96;

/**
 * Native modal dialog: focus moves inside, Escape and the backdrop close it, and focus returns to the trigger.
 * The element marked `data-autofocus` gets focus first.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  titleId,
  descriptionId,
  variant,
  titleColor,
  mobileHeaderAction,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragRef = useRef<{ pointerId: number; startY: number; offsetY: number } | null>(null);
  const suppressGripClickRef = useRef(false);
  const [retainedChildren, setRetainedChildren] = useState<ReactNode>(children);

  if (isOpen && retainedChildren !== children) setRetainedChildren(children);

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (variant === "drawer" && dialog?.open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRetainedChildren(children);
      dialog.dataset.closing = "true";
      dialog.style.setProperty("--dialog-drag-y", "calc(100% + 1px)");
    }
    onClose();
  };

  const handleGripPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dialog = dialogRef.current;
    if (variant !== "drawer" || !dialog || event.button !== 0) return;

    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, offsetY: 0 };
    suppressGripClickRef.current = false;
    dialog.dataset.dragging = "true";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGripPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    if (!drag || !dialog || drag.pointerId !== event.pointerId) return;

    drag.offsetY = Math.min(dialog.offsetHeight, Math.max(0, event.clientY - drag.startY));
    if (drag.offsetY >= 6) suppressGripClickRef.current = true;
    dialog.style.setProperty("--dialog-drag-y", `${drag.offsetY}px`);
  };

  const handleGripPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    if (!drag || !dialog || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    dialog.removeAttribute("data-dragging");
    if (drag.offsetY < 6) {
      dialog.style.removeProperty("--dialog-drag-y");
      return;
    }

    suppressGripClickRef.current = true;
    if (drag.offsetY < DRAG_CLOSE_THRESHOLD) {
      dialog.style.removeProperty("--dialog-drag-y");
      return;
    }

    requestClose();
  };

  const handleGripPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    suppressGripClickRef.current = false;
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.removeAttribute("data-dragging");
      dialog.style.removeProperty("--dialog-drag-y");
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && dialog.open && dialog.dataset.closing) {
      dialog.removeAttribute("data-closing");
      dialog.style.removeProperty("--dialog-drag-y");
    } else if (isOpen && !dialog.open) {
      dialog.removeAttribute("data-closing");
      dialog.removeAttribute("data-dragging");
      dialog.style.removeProperty("--dialog-drag-y");
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!isOpen && dialog.open) {
      if (variant === "drawer" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        dialog.dataset.closing = "true";
        dialog.style.setProperty("--dialog-drag-y", "calc(100% + 1px)");
      } else {
        dialog.close();
      }
    }
  }, [isOpen, variant]);

  return (
    <dialog
      ref={dialogRef}
      role={variant === "alert" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // React bubbles cancel/close through the component tree; stop them so a nested dialog does not close its parent.
      onCancel={(event) => {
        // Escape goes through onClose, so the owner can keep the dialog open (e.g. while an action is pending).
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
      onClose={(event) => {
        event.stopPropagation();
        event.currentTarget.removeAttribute("data-closing");
        event.currentTarget.removeAttribute("data-dragging");
        event.currentTarget.style.removeProperty("--dialog-drag-y");
        setRetainedChildren(null);
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "translate" && event.currentTarget.dataset.closing) {
          event.currentTarget.close();
        }
      }}
      className={`max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white p-0 text-left text-text backdrop:bg-lavender-900/60 dark:bg-lavender-900 dark:[--app-input:var(--color-lavender-950)] ${PANEL[variant]} ${variant === "drawer" ? "dialog-drawer" : ""}`}
    >
      <div className={CONTENT[variant]}>
        {variant === "sheet" || variant === "drawer" ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                if (suppressGripClickRef.current) {
                  suppressGripClickRef.current = false;
                  event.preventDefault();
                  return;
                }
                requestClose();
              }}
              onPointerDown={handleGripPointerDown}
              onPointerMove={handleGripPointerMove}
              onPointerUp={handleGripPointerUp}
              onPointerCancel={handleGripPointerCancel}
              aria-label="Fechar"
              className={`mx-auto mb-5 block h-6 w-16 cursor-grab touch-none rounded-full active:cursor-grabbing md:hidden ${FOCUS_RING}`}
            >
              <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-lavender-300 dark:bg-lavender-600" />
            </button>
            <div className="flex items-center justify-between gap-4">
              <h2
                id={titleId}
                className={`flex min-w-0 items-center gap-3 font-medium text-heading ${
                  variant === "drawer" ? "text-numeric-emphasis" : "text-section-heading"
                }`}
              >
                {titleColor ? (
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: titleColor }} />
                ) : null}
                <span className="min-w-0 break-words">{title}</span>
              </h2>
              {variant === "drawer" && mobileHeaderAction ? (
                <span className="grid size-10 shrink-0 place-items-center md:hidden">{mobileHeaderAction}</span>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className={`size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 dark:bg-lavender-800 dark:text-white ${
                  variant === "drawer" ? (mobileHeaderAction ? "hidden md:grid" : "grid") : "hidden md:grid"
                } ${FOCUS_RING}`}
              >
                <X aria-hidden="true" className="size-5" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : variant === "alert" ? (
          <>
            <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-danger-100">
              <TriangleAlert className="size-6 text-danger-600" strokeWidth={1.75} />
            </span>
            <h2 id={titleId} className="mt-4 text-section-heading font-medium text-heading">
              {title}
            </h2>
          </>
        ) : (
          <h2 id={titleId} className="text-section-heading font-medium text-heading">
            {title}
          </h2>
        )}
        {isOpen ? children : retainedChildren}
      </div>
    </dialog>
  );
}
