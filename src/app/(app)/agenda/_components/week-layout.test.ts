import { describe, expect, it } from "vitest";
import { hourRange, layoutDay } from "./week-layout";

const item = (id: string, startTime: string, endTime: string) => ({ id, startTime, endTime });

describe("hourRange", () => {
  it("shows 07:00–20:00 by default and widens to fit items", () => {
    expect(hourRange([])).toEqual({ firstHour: 7, lastHour: 20 });
    expect(hourRange([item("a", "06:30", "21:10")])).toEqual({ firstHour: 6, lastHour: 22 });
  });
});

describe("layoutDay", () => {
  it("places items by minutes from the first hour", () => {
    const [placed] = layoutDay([item("a", "08:30", "10:00")], 7);
    expect(placed).toMatchObject({ top: 90, duration: 90, lane: 0, lanes: 1 });
  });

  it("splits overlapping items into lanes and keeps later items full width", () => {
    const placed = layoutDay(
      [item("a", "07:00", "09:00"), item("b", "08:00", "10:00"), item("c", "09:00", "10:00"), item("d", "11:00", "12:00")],
      7,
    );
    const byId = Object.fromEntries(placed.map((entry) => [entry.item.id, entry]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.d).toMatchObject({ lane: 0, lanes: 1 });
  });
});
