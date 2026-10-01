import { describe, expect, it } from "vitest";
import { calendarDateIn, formatLongDate, weekOf } from "./dates";

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
