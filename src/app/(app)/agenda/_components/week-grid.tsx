import Link from "next/link";
import type { WeekDay } from "@/lib/dates";
import { FOCUS_RING } from "@/components/ui/styles";
import type { AgendaItemView } from "../_data-access/get-agenda-view";
import { ItemCard } from "./item-card";
import { hourRange, layoutDay } from "./week-layout";

const HOUR_PX = 56;
const ITEM_GAP_PX = 4;
const COLUMNS = "grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

type WeekGridProps = {
  week: WeekDay[];
  today: string;
  selectedDay: string;
  items: AgendaItemView[];
  dayHref: (day: string) => string;
  onOpen: (item: AgendaItemView) => void;
};

/** Desktop week: one column per day, items placed by time; overlapping items share the column. */
export function WeekGrid({ week, today, selectedDay, items, dayHref, onOpen }: WeekGridProps) {
  const { firstHour, lastHour } = hourRange(items);
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index);

  return (
    <div>
      <nav aria-label="Dias da semana" className={`${COLUMNS} gap-2`}>
        <span aria-hidden="true" />
        {week.map((day) => {
          const isSelected = day.date === selectedDay;
          return (
            <Link
              key={day.date}
              href={dayHref(day.date)}
              replace
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={`relative flex h-16 flex-col items-center justify-center rounded-full ${FOCUS_RING} ${
                isSelected
                  ? "bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900"
                  : "bg-lavender-100 text-text dark:bg-lavender-800"
              }`}
            >
              {day.date === today ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 size-1.5 rounded-full ${isSelected ? "bg-lime-500 dark:bg-lavender-900" : "bg-lavender-700 dark:bg-lime-500"}`}
                />
              ) : null}
              <span aria-hidden="true" className="text-numeric-emphasis font-medium">
                {day.dayOfMonth}
              </span>
              <span
                aria-hidden="true"
                className={`text-xs ${isSelected ? "text-lavender-300 dark:text-lavender-900" : "text-text-secondary"}`}
              >
                {day.weekdayShort}
              </span>
              <span className="sr-only">{day.longLabel}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`${COLUMNS} mt-6`}>
        <div aria-hidden="true">
          {hours.map((hour) => (
            <div key={hour} className="relative text-xs text-text-secondary" style={{ height: HOUR_PX }}>
              <span className="absolute -top-2">{`${String(hour).padStart(2, "0")}:00`}</span>
            </div>
          ))}
        </div>
        {week.map((day) => {
          const dayItems = items.filter((item) => item.date === day.date);
          return (
            <section
              key={day.date}
              aria-label={day.longLabel}
              className="relative border-l border-line dark:border-lavender-800"
              style={{ height: hours.length * HOUR_PX }}
            >
              {hours.map((hour, index) => (
                <span
                  key={hour}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-line dark:border-lavender-800"
                  style={{ top: index * HOUR_PX }}
                />
              ))}
              <ol aria-label={`Compromissos de ${day.longLabel}`}>
                {layoutDay(dayItems, firstHour).map(({ item, top, duration, lane, lanes }) => (
                  <li
                    key={item.id}
                    className="absolute px-0.5"
                    style={{
                      top: (top / 60) * HOUR_PX + ITEM_GAP_PX / 2,
                      height: (duration / 60) * HOUR_PX - ITEM_GAP_PX,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    <ItemCard item={item} layout="grid" onOpen={() => onOpen(item)} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
