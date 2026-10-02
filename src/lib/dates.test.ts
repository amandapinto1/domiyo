import { describe, expect, it } from "vitest";
import {
  calendarDateIn,
  formatItemDate,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  formatWeekRange,
  monthGrid,
  shiftMonth,
  timeIn,
  weekOf,
  zonedTimeToUtc,
} from "./dates";

describe("calendarDateIn", () => {
  it("uses the calendar date of the given time zone, not UTC", () => {
    const lateEveningInFortaleza = new Date("2026-09-29T01:30:00Z");
    expect(calendarDateIn("America/Fortaleza", lateEveningInFortaleza)).toBe("2026-09-28");
    expect(calendarDateIn("UTC", lateEveningInFortaleza)).toBe("2026-09-29");
  });
});

describe("formatLongDate", () => {
  it("formats in pt-BR with a capitalized weekday", () => {
    expect(formatLongDate("2026-09-28")).toBe("Segunda-feira, 28 de setembro");
  });
});

describe("formatShortDate", () => {
  it("shows the day and abbreviated month in the given time zone", () => {
    const lateEveningInFortaleza = new Date("2026-10-01T01:30:00Z");
    expect(formatShortDate(lateEveningInFortaleza, "America/Fortaleza")).toBe("30 set");
    expect(formatShortDate(lateEveningInFortaleza, "UTC")).toBe("1 out");
  });
});

describe("weekOf", () => {
  it("returns Sunday to Saturday around the day, across a month change", () => {
    const week = weekOf("2026-09-28");
    expect(week.map((day) => day.date)).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(week.map((day) => day.weekdayShort)).toEqual(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]);
    expect(week[4]).toMatchObject({ dayOfMonth: 1, longLabel: "Quinta-feira, 1 de outubro" });
  });

  it("starts on the day itself when it is a Sunday", () => {
    expect(weekOf("2026-09-27")[0].date).toBe("2026-09-27");
  });
});

describe("agenda date helpers", () => {
  it("formats the week range across and inside a month", () => {
    expect(formatWeekRange("2026-09-27", "2026-10-03")).toBe("Semana de 27 set – 3 out");
    expect(formatWeekRange("2026-09-06", "2026-09-12")).toBe("Semana de 6 – 12 set");
  });

  it("formats item dates and months", () => {
    expect(formatItemDate("2026-09-28")).toBe("Segunda, 28 de setembro");
    expect(formatMonthYear("2026-09-28")).toBe("Setembro 2026");
  });

  it("builds a Sunday-first month grid with the neighboring days", () => {
    const grid = monthGrid("2026-09-15");
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toEqual({ date: "2026-08-30", dayOfMonth: 30, isInMonth: false });
    expect(grid[4][6]).toEqual({ date: "2026-10-03", dayOfMonth: 3, isInMonth: false });
  });

  it("shifts months across a year boundary", () => {
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("converts wall-clock times in the app time zone to instants and back", () => {
    const instant = zonedTimeToUtc("2026-09-28", "07:00", "America/Fortaleza");
    expect(instant.toISOString()).toBe("2026-09-28T10:00:00.000Z");
    expect(timeIn("America/Fortaleza", instant)).toBe("07:00");
    expect(zonedTimeToUtc("2026-07-01", "09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
  });
});
