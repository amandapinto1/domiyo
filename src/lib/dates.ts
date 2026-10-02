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

/** "28 set": the day and abbreviated month of `instant` in `timeZone`. */
export function formatShortDate(instant: Date, timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, day: "numeric", month: "short" })
    .format(instant)
    .replace(/\.|\bde /g, "");
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

export function addDays(day: string, days: number): string {
  const date = toUtcDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return toCalendarDate(date);
}

/** "Segunda, 28 de setembro": the long date without "-feira", as agenda items show it. */
export function formatItemDate(day: string): string {
  return formatLongDate(day).replace("-feira", "");
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Setembro". */
export function formatMonth(day: string): string {
  return capitalize(new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(toUtcDate(day)));
}

/** "Setembro 2026". */
export function formatMonthYear(day: string): string {
  return `${formatMonth(day)} ${day.slice(0, 4)}`;
}

/** "Semana de 27 set – 3 out", or "Semana de 6 – 12 set" inside one month. */
export function formatWeekRange(firstDay: string, lastDay: string): string {
  const short = (day: string) => formatShortDate(toUtcDate(day), "UTC");
  const start = firstDay.slice(0, 7) === lastDay.slice(0, 7) ? String(Number(firstDay.slice(8))) : short(firstDay);
  return `Semana de ${start} – ${short(lastDay)}`;
}

export type MonthDay = { date: string; dayOfMonth: number; isInMonth: boolean };

/** Sunday-first weeks covering the month of `day`, padded with the neighboring months' days. */
export function monthGrid(day: string): MonthDay[][] {
  const month = day.slice(0, 7);
  const weeks: MonthDay[][] = [];
  for (let weekStart = weekOf(`${month}-01`)[0].date; weekStart.slice(0, 7) <= month; weekStart = addDays(weekStart, DAYS_IN_WEEK)) {
    weeks.push(
      weekOf(weekStart).map(({ date, dayOfMonth }) => ({ date, dayOfMonth, isInMonth: date.slice(0, 7) === month })),
    );
  }
  return weeks;
}

/** The first day of the month before (`-1`) or after (`1`) the month of `day`. */
export function shiftMonth(day: string, months: number): string {
  const date = toUtcDate(`${day.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toCalendarDate(date);
}

/** "07:00": the wall-clock time of `instant` in `timeZone`. */
export function timeIn(timeZone: string, instant: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    instant,
  );
}

function offsetMs(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((entry) => entry.type === type)?.value);
  const wallClock = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return wallClock - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant when the clock in `timeZone` shows `day` at `time` ("HH:mm"). */
export function zonedTimeToUtc(day: string, time: string, timeZone: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const asUtc = toUtcDate(day).getTime() + (hours * 60 + minutes) * 60_000;
  const firstGuess = asUtc - offsetMs(timeZone, new Date(asUtc));
  return new Date(asUtc - offsetMs(timeZone, new Date(firstGuess)));
}
