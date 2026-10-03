"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const PULL_THRESHOLD = 72;

type PullGesture = { startX: number; startY: number };

export function PullToRefresh() {
  const router = useRouter();
  const gestureRef = useRef<PullGesture | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    function clearGesture() {
      gestureRef.current = null;
      setPullDistance(0);
    }

    function handleTouchStart(event: TouchEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const startsOnControl = target?.closest(
        "a, button, input, select, textarea, dialog, [role='dialog'], [contenteditable='true']",
      );

      if (event.touches.length !== 1 || window.scrollY > 0 || isPending || startsOnControl) {
        clearGesture();
        return;
      }

      const touch = event.touches[0];
      gestureRef.current = { startX: touch.clientX, startY: touch.clientY };
    }

    function handleTouchMove(event: TouchEvent) {
      const gesture = gestureRef.current;
      const touch = event.touches[0];
      if (!gesture || !touch) return;

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      if (window.scrollY > 0 || deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
        clearGesture();
        return;
      }

      setPullDistance(deltaY);
    }

    function handleTouchEnd(event: TouchEvent) {
      const gesture = gestureRef.current;
      const touch = event.changedTouches[0];
      const shouldRefresh = Boolean(
        gesture && touch && window.scrollY <= 0 && touch.clientY - gesture.startY >= PULL_THRESHOLD,
      );
      clearGesture();

      if (shouldRefresh) startTransition(() => router.refresh());
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", clearGesture, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", clearGesture);
    };
  }, [isPending, router]);

  const isPulling = pullDistance > 0;
  const isVisible = isPending || isPulling;
  const canRefresh = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_0.5rem)] z-50 flex justify-center"
    >
      <div
        role={isPending ? "status" : undefined}
        aria-hidden={!isVisible}
        className={`flex items-center gap-2 rounded-full bg-white px-4 py-2 text-body-small text-text-secondary shadow-md transition-opacity motion-reduce:transition-none dark:bg-lavender-800 ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={isPulling && !isPending ? { transform: `translateY(${Math.min(pullDistance, PULL_THRESHOLD)}px)` } : undefined}
      >
        <LoaderCircle aria-hidden="true" className={`size-4 ${isPending ? "motion-safe:animate-spin" : ""}`} />
        <span>{isPending ? "Atualizando..." : canRefresh ? "Solte para atualizar" : "Puxe para atualizar"}</span>
      </div>
    </div>
  );
}