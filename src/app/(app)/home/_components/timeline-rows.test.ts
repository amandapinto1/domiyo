import { describe, expect, it } from "vitest";
import { buildTimelineRows } from "./timeline-rows";

const item = (id: string, startTime: string, endTime: string) => ({
  id,
  subject: `Disciplina ${id}`,
  type: "Aula teórica",
  startTime,
  endTime,
  color: "#A1C3E3",
});

describe("buildTimelineRows", () => {
  it("sorts items and marks the first free full hour before the next item", () => {
    const rows = buildTimelineRows([item("b", "10:00", "11:40"), item("a", "07:00", "08:40")]);
    expect(rows).toEqual([
      { kind: "item", item: item("a", "07:00", "08:40") },
      { kind: "free", time: "09:00" },
      { kind: "item", item: item("b", "10:00", "11:40") },
    ]);
  });

  it("adds no marker when the next item starts on or before that hour", () => {
    const rows = buildTimelineRows([item("a", "07:00", "08:00"), item("b", "08:00", "09:40"), item("c", "09:30", "10:00")]);
    expect(rows.map((row) => row.kind)).toEqual(["item", "item", "item"]);
  });

  it("adds no marker after the last item", () => {
    expect(buildTimelineRows([item("a", "17:30", "19:10")])).toHaveLength(1);
  });
});
