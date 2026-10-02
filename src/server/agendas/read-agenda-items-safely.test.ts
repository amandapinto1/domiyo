import { describe, expect, it } from "vitest";
import { readAgendaItemsSafely } from "./read-agenda-items-safely";

describe("readAgendaItemsSafely", () => {
  it("returns records when the agenda query succeeds", async () => {
    const records = [{ id: "item-1" }];
    await expect(readAgendaItemsSafely(async () => records)).resolves.toEqual({ records, unavailable: false });
  });

  it("marks records unavailable instead of presenting a false empty agenda", async () => {
    await expect(readAgendaItemsSafely(async () => { throw new Error("query failed"); })).resolves.toEqual({
      records: [],
      unavailable: true,
    });
  });
});