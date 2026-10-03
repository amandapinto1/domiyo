"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { addDays, daysStartingOn } from "@/lib/dates";
import { FOCUS_RING } from "@/components/ui/styles";

type WeekSwipeAreaProps = {
  startDate: string;
  selectedDay: string;
  today: string;
  href: (day: string, startDate: string) => string;
  onWindowChange: (startDate: string) => void;
  className?: string;
};

const DAYS_VISIBLE = 7;
const DAYS_BUFFERED = 7;
const DAYS_TRACKED = DAYS_VISIBLE + DAYS_BUFFERED * 2;

export function WeekSwipeArea({ startDate, selectedDay, today, href, onWindowChange, className }: WeekSwipeAreaProps) {
  const [windowStart, setWindowStart] = useState(startDate);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const gesture = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const pendingSwipe = useRef<{ direction: -1 | 1; days: number } | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressTouchClick = useRef(false);

  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    },
    [],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    suppressTouchClick.current = false;
    if (
      event.pointerType !== "touch" ||
      !event.isPrimary ||
      isAnimating ||
      !window.matchMedia("(max-width: 767px)").matches
    ) {
      gesture.current = null;
      return;
    }
    gesture.current = { x: event.clientX, y: event.clientY, startedAt: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragOffset(0);
    setTransitionDuration(0);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const initial = gesture.current;
    if (!initial) return;
    const deltaX = event.clientX - initial.x;
    const deltaY = event.clientY - initial.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) setDragOffset(deltaX);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const initial = gesture.current;
    gesture.current = null;
    if (!initial) return;

    const deltaX = event.clientX - initial.x;
    const deltaY = event.clientY - initial.y;
    if (Math.abs(deltaX) < 16 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      setDragOffset(0);
      return;
    }

    const cellWidth = event.currentTarget.getBoundingClientRect().width / DAYS_VISIBLE;
    const velocity = Math.abs(deltaX) / Math.max(performance.now() - initial.startedAt, 1);
    const dayCount = Math.min(7, Math.max(1, Math.round(Math.abs(deltaX) / cellWidth + Math.max(0, velocity - 0.45) * 1.5)));
    const direction = deltaX < 0 ? 1 : -1;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : Math.max(180, Math.min(360, 360 - velocity * 80));
    suppressTouchClick.current = true;
    pendingSwipe.current = { direction, days: dayCount };
    setTransitionDuration(duration);
    setIsAnimating(true);
    setDragOffset(-direction * dayCount * cellWidth);
    if (duration === 0) finishSwipe();
    else finishTimer.current = setTimeout(finishSwipe, duration + 80);
  }

  function finishSwipe() {
    const swipe = pendingSwipe.current;
    if (!swipe) return;
    if (finishTimer.current) clearTimeout(finishTimer.current);
    finishTimer.current = null;
    pendingSwipe.current = null;
    const nextStart = addDays(windowStart, swipe.direction * swipe.days);
    setWindowStart(nextStart);
    setDragOffset(0);
    setIsAnimating(false);
    onWindowChange(nextStart);
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if (!suppressTouchClick.current) return;
    suppressTouchClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  const days = daysStartingOn(addDays(windowStart, -DAYS_BUFFERED), DAYS_TRACKED);

  return (
    <nav
      aria-label="Dias da semana"
      className={`overflow-hidden touch-pan-y ${className ?? ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        gesture.current = null;
        setDragOffset(0);
      }}
      onClickCapture={handleClickCapture}
    >
      <ul
        className="grid list-none grid-cols-[repeat(21,minmax(0,1fr))]"
        style={{
          width: "300%",
          transform: `translate3d(calc(-33.333333% + ${dragOffset}px), 0, 0)`,
          transition: isAnimating ? `transform ${transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
        }}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "transform") finishSwipe();
        }}
      >
        {days.map((day, index) => {
          const isInWindow = index >= DAYS_BUFFERED && index < DAYS_BUFFERED + DAYS_VISIBLE;
          const isSelected = day.date === selectedDay;
          return (
            <li key={day.date} aria-hidden={!isInWindow} className="min-w-0 px-0.5">
              <Link
                href={href(day.date, windowStart)}
                replace
                scroll={false}
                aria-current={isSelected ? "date" : undefined}
                tabIndex={isInWindow ? undefined : -1}
                className={`relative mx-auto flex h-17.5 w-full max-w-10 flex-col items-center justify-center rounded-full ${FOCUS_RING} ${
                  isSelected
                    ? "bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900"
                    : "bg-lavender-100 text-text dark:bg-lavender-800"
                }`}
              >
                {day.date === today ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.75 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                      isSelected ? "bg-lime-500 dark:bg-lavender-900" : "bg-lavender-700 dark:bg-lime-500"
                    }`}
                  />
                ) : null}
                <span aria-hidden="true" className="text-numeric-emphasis font-medium">
                  {day.dayOfMonth}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-body-small ${isSelected ? "text-lavender-300 dark:text-lavender-900" : "text-text-secondary"}`}
                >
                  {day.weekdayShort}
                </span>
                <span className="sr-only">{day.longLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}