import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { weekOf } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function describeCount(count: number): string {
  if (count === 0) return "Nenhum compromisso";
  return count === 1 ? "1 compromisso" : `${count} compromissos`;
}

type AgendaCardProps = { today: string; selectedDay: string; itemCount: number };

/** "Agenda de hoje": item count and the week strip that picks the day shown in the timeline. */
export function AgendaCard({ today, selectedDay, itemCount }: AgendaCardProps) {
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

      <nav aria-label="Dias da semana">
        <ul className="flex justify-between gap-1">
          {weekOf(selectedDay).map((day) => {
            const isSelected = day.date === selectedDay;
            return (
              <li key={day.date}>
                <Link
                  href={day.date === today ? ROUTES.home : `${ROUTES.home}?day=${day.date}`}
                  replace
                  scroll={false}
                  aria-current={isSelected ? "date" : undefined}
                  className={`relative flex h-17.5 w-10 flex-col items-center justify-center rounded-full ${FOCUS_RING} ${
                    isSelected
                      ? "bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900"
                      : "bg-lavender-100 text-text dark:bg-lavender-800"
                  }`}
                >
                  {isSelected ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-0.75 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-lime-500 dark:bg-lavender-900"
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
    </section>
  );
}
