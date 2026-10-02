import { describe, expect, it } from "vitest";
import { groupBySlot } from "./day-groups";

const at = (id: string, startTime: string, endTime: string) => ({ id, startTime, endTime });

describe("groupBySlot", () => {
  it("puts items with the same start and end in one group, keeping their order", () => {
    const groups = groupBySlot([
      at("hemato", "18:30", "21:30"),
      at("eletivo", "08:00", "10:00"),
      at("terapia", "18:30", "21:30"),
    ]);

    expect(groups.map((group) => group.map(({ id }) => id))).toEqual([["eletivo"], ["hemato", "terapia"]]);
  });

  it("keeps items that start together but end at different times in separate rows", () => {
    const groups = groupBySlot([at("long", "08:00", "12:00"), at("short", "08:00", "09:00")]);

    expect(groups.map((group) => group.map(({ id }) => id))).toEqual([["short"], ["long"]]);
  });

  it("returns no groups for an empty day", () => {
    expect(groupBySlot([])).toEqual([]);
  });
});
