"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { centeredDayStripStart } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { WeekSwipeArea } from "../../_components/week-swipe-area";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function describeCount(count: number): string {
  if (count === 0) return "Nenhum compromisso";
  return count === 1 ? "1 compromisso" : `${count} compromissos`;
}

type AgendaCardProps = { today: string; selectedDay: string; dayStripStart: string; itemCount: number };

/** "Agenda de hoje": item count and the week strip that picks the day shown in the timeline. */
export function AgendaCard({ today, selectedDay, dayStripStart, itemCount }: AgendaCardProps) {
  const router = useRouter();
  const href = (day: string, start = dayStripStart) => {
    const params = new URLSearchParams();
    if (day !== today) params.set("day", day);
    if (start !== centeredDayStripStart(day)) params.set("start", start);
    const query = params.toString();
    return query ? `${ROUTES.home}?${query}` : ROUTES.home;
  };

  return (
    <section aria-labelledby="agenda-card-title" className="flex flex-col gap-5 rounded-xl bg-white p-5 dark:bg-lavender-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="agenda-card-title" className="text-section-heading font-medium text-text">
            Agenda de hoje
          </h2>
          <p className="mt-1 text-body-small text-text-secondary">{describeCount(itemCount)}</p>
        </div>
        <Link
          href={ROUTES.agenda}
          aria-label="Abrir agenda"
          title="Abrir agenda"
          className={`grid size-10 shrink-0 place-items-center rounded-full bg-lavender-100 text-lavender-900 dark:bg-lavender-800 dark:text-white ${FOCUS_RING}`}
        >
          <ArrowUpRight aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
      </div>

      <WeekSwipeArea
        key={dayStripStart}
        startDate={dayStripStart}
        selectedDay={selectedDay}
        today={today}
        href={href}
        onWindowChange={(start) => router.replace(href(selectedDay, start), { scroll: false })}
      />
    </section>
  );
}
