"use client";

import { TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
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
const DRAG_ACTIVATION_THRESHOLD = 6;
const INTERACTIVE_TARGET_SELECTOR =
  "button, a[href], input, select, textarea, label, summary, [contenteditable='true'], [role='button'], [role='link'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem']";

type DialogDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetY: number;
  didMove: boolean;
  isGrip: boolean;
};

function isSwipeDismissVariant(variant: DialogProps["variant"]): boolean {
  return variant === "sheet" || variant === "drawer";
}

function shouldAnimateDismiss(variant: DialogProps["variant"]): boolean {
  return variant === "drawer" || (variant === "sheet" && !window.matchMedia("(min-width: 768px)").matches);
}

function getDismissGestureTarget(target: EventTarget | null, dialog: HTMLDialogElement): { isGrip: boolean } | null {
  if (!(target instanceof Element) || !dialog.contains(target)) return null;
  if (target.closest("dialog") !== dialog) return null;

  const isGrip = target.closest("[data-dialog-grip]") !== null;
  if (!isGrip && target.closest(INTERACTIVE_TARGET_SELECTOR)) return null;

  let ancestor: Element | null = target;
  while (ancestor && ancestor !== dialog) {
    const style = window.getComputedStyle(ancestor);
    const isScrollable = (style.overflowY === "auto" || style.overflowY === "scroll") && ancestor.scrollHeight > ancestor.clientHeight;
    if (isScrollable && ancestor.scrollTop > 0) return null;
    ancestor = ancestor.parentElement;
  }

  return dialog.scrollTop <= 0 ? { isGrip } : null;
}

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
  const dragRef = useRef<DialogDrag | null>(null);
  const suppressGripClickRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => undefined);
  const [retainedChildren, setRetainedChildren] = useState<ReactNode>(children);
  const retainedHeaderRef = useRef({ title, titleColor, mobileHeaderAction });

  if (isOpen && retainedChildren !== children) setRetainedChildren(children);
  if (isOpen) retainedHeaderRef.current = { title, titleColor, mobileHeaderAction };

  const isClosing = !isOpen && Boolean(dialogRef.current?.open);
  const visibleTitle = isClosing ? retainedHeaderRef.current.title : title;
  const visibleTitleColor = isClosing ? retainedHeaderRef.current.titleColor : titleColor;
  const visibleMobileHeaderAction = isClosing ? retainedHeaderRef.current.mobileHeaderAction : mobileHeaderAction;

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (shouldAnimateDismiss(variant) && dialog?.open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRetainedChildren(children);
      dialog.dataset.closing = "true";
      dialog.style.setProperty("--dialog-drag-y", "calc(100% + 1px)");
    }
    onClose();
  };
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  const beginDrag = useCallback((target: EventTarget | null, pointerId: number, clientX: number, clientY: number) => {
    const dialog = dialogRef.current;
    if (
      !isSwipeDismissVariant(variant) ||
      window.matchMedia("(min-width: 768px)").matches ||
      !dialog?.open ||
      dragRef.current
    ) return;

    const gestureTarget = getDismissGestureTarget(target, dialog);
    if (!gestureTarget) return;

    dragRef.current = {
      pointerId,
      startX: clientX,
      startY: clientY,
      offsetY: 0,
      didMove: false,
      isGrip: gestureTarget.isGrip,
    };
    suppressGripClickRef.current = false;
  }, [variant]);

  const updateDrag = (dialog: HTMLDialogElement, pointerId: number, clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return false;

    const offsetX = clientX - drag.startX;
    const offsetY = clientY - drag.startY;
    if (!drag.didMove && Math.abs(offsetX) > Math.abs(offsetY)) {
      dragRef.current = null;
      dialog.style.removeProperty("--dialog-drag-y");
      return false;
    }

    drag.offsetY = Math.min(dialog.offsetHeight, Math.max(0, offsetY));
    if (drag.offsetY >= DRAG_ACTIVATION_THRESHOLD) {
      drag.didMove = true;
      dialog.dataset.dragging = "true";
    }
    dialog.style.setProperty("--dialog-drag-y", `${drag.offsetY}px`);
    return drag.didMove;
  };

  const finishDrag = (dialog: HTMLDialogElement, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    dragRef.current = null;
    dialog.removeAttribute("data-dragging");
    if (drag.didMove && drag.isGrip) suppressGripClickRef.current = true;

    if (!drag.didMove || drag.offsetY < DRAG_CLOSE_THRESHOLD) {
      dialog.style.removeProperty("--dialog-drag-y");
      return;
    }

    requestCloseRef.current();
  };

  const cancelDrag = (dialog: HTMLDialogElement, pointerId: number) => {
    if (dragRef.current?.pointerId !== pointerId) return;
    dragRef.current = null;
    dialog.removeAttribute("data-dragging");
    dialog.style.removeProperty("--dialog-drag-y");
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    beginDrag(event.target, event.pointerId, event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const wasDragging = dragRef.current?.didMove ?? false;
    const isDragging = updateDrag(event.currentTarget, event.pointerId, event.clientX, event.clientY);
    if (isDragging) {
      if (!wasDragging) event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDialogElement>) => {
    finishDrag(event.currentTarget, event.pointerId);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDialogElement>) => {
    cancelDrag(event.currentTarget, event.pointerId);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isSwipeDismissVariant(variant)) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.changedTouches[0];
      if (touch) beginDrag(event.target, touch.identifier, touch.clientX, touch.clientY);
    };
    const handleTouchMove = (event: TouchEvent) => {
      const drag = dragRef.current;
      const touch = drag ? Array.from(event.touches).find((currentTouch) => currentTouch.identifier === drag.pointerId) : undefined;
      if (!drag || !touch) return;
      if (updateDrag(dialog, drag.pointerId, touch.clientX, touch.clientY)) event.preventDefault();
    };
    const handleTouchEnd = (event: TouchEvent) => {
      const endedTouch = Array.from(event.changedTouches).find((touch) => touch.identifier === dragRef.current?.pointerId);
      if (endedTouch) finishDrag(dialog, endedTouch.identifier);
    };
    const handleTouchCancel = (event: TouchEvent) => {
      const cancelledTouch = Array.from(event.changedTouches).find((touch) => touch.identifier === dragRef.current?.pointerId);
      if (cancelledTouch) cancelDrag(dialog, cancelledTouch.identifier);
    };

    dialog.addEventListener("touchstart", handleTouchStart, { passive: true });
    dialog.addEventListener("touchmove", handleTouchMove, { passive: false });
    dialog.addEventListener("touchend", handleTouchEnd, { passive: true });
    dialog.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    return () => {
      dialog.removeEventListener("touchstart", handleTouchStart);
      dialog.removeEventListener("touchmove", handleTouchMove);
      dialog.removeEventListener("touchend", handleTouchEnd);
      dialog.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [beginDrag, variant]);

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
      if (shouldAnimateDismiss(variant) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "translate" && event.currentTarget.dataset.closing) {
          event.currentTarget.close();
        }
      }}
      className={`max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white p-0 text-left text-text backdrop:bg-lavender-980/78 dark:bg-lavender-900 dark:[--app-input:var(--color-lavender-950)] ${PANEL[variant]} ${isSwipeDismissVariant(variant) ? "dialog-mobile-dismissable" : ""} ${variant === "drawer" ? "dialog-drawer" : ""}`}
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
              aria-label="Fechar"
              data-dialog-grip
              className={`mx-auto mb-5 block h-6 w-16 cursor-grab touch-none rounded-full active:cursor-grabbing md:hidden ${FOCUS_RING}`}
            >
              <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-lavender-300 dark:bg-lavender-600" />
            </button>
            <div
              className={`flex items-center justify-between gap-x-4 gap-y-2 ${
                variant === "drawer" && visibleMobileHeaderAction ? "flex-wrap md:flex-nowrap" : ""
              }`}
            >
              <h2
                id={titleId}
                className={`flex min-w-0 items-center gap-3 font-medium text-heading ${
                  variant === "drawer" ? "text-numeric-emphasis" : "text-section-heading"
                } ${variant === "drawer" && visibleMobileHeaderAction ? "flex-[1_1_max-content] md:flex-auto" : ""}`}
              >
                {visibleTitleColor ? (
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: visibleTitleColor }} />
                ) : null}
                <span className="min-w-0 break-words">{visibleTitle}</span>
              </h2>
              {variant === "drawer" && visibleMobileHeaderAction ? (
                <span className="ml-auto flex min-h-10 max-w-full shrink-0 items-center justify-center md:hidden">
                  {visibleMobileHeaderAction}
                </span>
              ) : null}
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
