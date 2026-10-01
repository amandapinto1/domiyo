// Calendar dates are "YYYY-MM-DD" strings handled as UTC midnights, so day arithmetic never crosses a DST change.

/** MVP: every date is shown in one time zone (docs/ARCHITECTURE.md › "Time zones"). Read it on the server only. */
export const APP_TIME_ZONE = process.env.APP_DEFAULT_TIME_ZONE ?? "America/Fortaleza";

const DAYS_IN_WEEK = 7;
const WEEKDAY_ABBREVIATIONS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const longDateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

export type WeekDay = { date: string; dayOfMonth: number; weekdayShort: string; longLabel: string };

function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The calendar date of `instant` in `timeZone`. */
export function calendarDateIn(timeZone: string, instant = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  );
}

/** "Segunda-feira, 28 de setembro". */
export function formatLongDate(day: string): string {
  const text = longDateFormat.format(toUtcDate(day));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The Sunday-to-Saturday week that contains `day`. */
export function weekOf(day: string): WeekDay[] {
  const sunday = toUtcDate(day);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
    const date = new Date(sunday);
    date.setUTCDate(sunday.getUTCDate() + index);
    const calendarDate = toCalendarDate(date);
    return {
      date: calendarDate,
      dayOfMonth: date.getUTCDate(),
      weekdayShort: WEEKDAY_ABBREVIATIONS[date.getUTCDay()],
      longLabel: formatLongDate(calendarDate),
    };
  });
}
