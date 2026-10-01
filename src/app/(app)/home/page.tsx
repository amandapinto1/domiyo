import { Bell } from "lucide-react";
import { z } from "zod";
import { APP_TIME_ZONE, calendarDateIn, formatLongDate } from "@/lib/dates";
import type { SearchParams } from "@/lib/routes";
import { AgendaCard } from "./_components/agenda-card";
import { Timeline } from "./_components/timeline";
import { getHomeView } from "./_data-access/get-home-view";

const daySchema = z.iso.date();

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { firstName, items } = await getHomeView();
  const today = calendarDateIn(APP_TIME_ZONE);
  const requestedDay = daySchema.safeParse((await searchParams).day);
  const selectedDay = requestedDay.success ? requestedDay.data : today;

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-14 pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title font-medium text-heading">Olá, {firstName}</h1>
          <p className="mt-1 text-body-small text-text-secondary">{formatLongDate(today)}</p>
        </div>
        {/* Notifications are not built yet; the bell keeps its place in the header. */}
        <button
          type="button"
          disabled
          aria-label="Notificações (em breve)"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lavender-900 dark:bg-lavender-900 dark:text-white"
        >
          <Bell aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </button>
      </header>

      <div className="mt-6 flex-1 md:mt-8 xl:grid xl:grid-cols-[37.5rem_minmax(0,1fr)] xl:gap-8">
        <div className="md:max-w-150">
          <AgendaCard today={today} selectedDay={selectedDay} itemCount={items.length} />
          <Timeline items={items} isToday={selectedDay === today} />
        </div>

        {/* Reserved for the bills/tasks summaries; what comes first is an open product decision. */}
        <section
          aria-labelledby="upcoming-title"
          className="hidden flex-col items-center justify-center rounded-xl border-2 border-dashed border-lavender-300 bg-white p-8 text-center xl:flex dark:border-lavender-600 dark:bg-lavender-900"
        >
          <h2 id="upcoming-title" className="text-section-heading font-medium text-text">
            Próximas contas e tarefas
          </h2>
          <p className="mt-2 text-body-small text-text-secondary">Em breve nesta área.</p>
        </section>
      </div>
    </main>
  );
}
