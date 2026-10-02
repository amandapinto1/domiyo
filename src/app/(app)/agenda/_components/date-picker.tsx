"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FOCUS_RING } from "@/components/ui/styles";
import { formatLongDate, formatMonthYear, monthGrid, shiftMonth } from "@/lib/dates";
import { getEventDaysAction } from "../_actions/get-event-days";

const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];
const NAV_BUTTON = `grid size-10 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 dark:bg-lavender-800 dark:text-white ${FOCUS_RING}`;

type DatePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  agendaIds: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
};

/** "Escolher data": a month calendar that marks the days with items of the selected agendas. */
export function DatePicker({ isOpen, onClose, householdId, agendaIds, selectedDay, onSelect }: DatePickerProps) {
  const id = useId();
  const [month, setMonth] = useState(selectedDay);
  const [eventDays, setEventDays] = useState<{ month: string; days: Set<string> } | null>(null);
  const monthKey = month.slice(0, 7);
  const agendaKey = agendaIds.join(",");

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    getEventDaysAction({ householdId, agendaIds: agendaKey.split(","), month: `${monthKey}-01` }).then((days) => {
      if (isCurrent) setEventDays({ month: monthKey, days: new Set(days) });
    });
    return () => {
      isCurrent = false;
    };
  }, [isOpen, householdId, agendaKey, monthKey]);

  const selectedWeekStart = monthGrid(selectedDay).find((week) => week.some((day) => day.date === selectedDay))?.[0].date;
  const days = eventDays?.month === monthKey ? eventDays.days : new Set<string>();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Escolher data" titleId={`${id}-title`} variant="sheet">
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Mês anterior"
          className={NAV_BUTTON}
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
        <p aria-live="polite" className="text-body font-medium text-text">
          {formatMonthYear(month)}
        </p>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês" className={NAV_BUTTON}>
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
      </div>

      <table className="mt-4 w-full table-fixed border-separate border-spacing-y-1 text-center">
        <thead>
          <tr>
            {WEEKDAY_INITIALS.map((initial, index) => (
              <th key={index} scope="col" className="pb-2 text-xs font-medium text-text-secondary">
                {initial}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week) => {
            const isSelectedWeek = week[0].date === selectedWeekStart;
            return (
              <tr key={week[0].date}>
                {week.map((day, index) => {
                  const isSelected = day.date === selectedDay;
                  const hasEvents = days.has(day.date);
                  const rounded = index === 0 ? "rounded-l-full" : index === 6 ? "rounded-r-full" : "";
                  return (
                    <td key={day.date} className={`p-0 ${isSelectedWeek ? `bg-lavender-100 dark:bg-lavender-800 ${rounded}` : ""}`}>
                      <button
                        type="button"
                        data-autofocus={isSelected ? true : undefined}
                        onClick={() => onSelect(day.date)}
                        aria-current={isSelected ? "date" : undefined}
                        aria-label={`${formatLongDate(day.date)}${hasEvents ? ", com compromissos" : ""}`}
                        className={`relative mx-auto grid size-11 cursor-pointer place-items-center rounded-full text-body ${FOCUS_RING} ${
                          isSelected
                            ? "bg-lavender-900 text-white dark:bg-lime-500 dark:text-lavender-900"
                            : day.isInMonth
                              ? "text-text"
                              : "text-lavender-500 dark:text-lavender-600"
                        }`}
                      >
                        {day.dayOfMonth}
                        {hasEvents ? (
                          <span
                            aria-hidden="true"
                            className={`absolute bottom-1 size-1 rounded-full ${
                              isSelected ? "bg-lime-500 dark:bg-lavender-900" : "bg-lavender-700 dark:bg-lavender-300"
                            }`}
                          />
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-text-secondary">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-lavender-700 dark:bg-lavender-300" />
        Dia com eventos
      </p>
    </Dialog>
  );
}
