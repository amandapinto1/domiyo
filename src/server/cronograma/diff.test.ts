import { describe, expect, it } from "vitest";
import { diffCronograma } from "./diff";
import type { CronogramaEvent } from "./schema";

const event = (changes: Partial<CronogramaEvent> = {}): CronogramaEvent => ({
  date: "2026-08-01",
  startsAt: new Date("2026-08-01T11:00:00.000Z"),
  endsAt: new Date("2026-08-01T13:00:00.000Z"),
  color: "#AABBCC",
  title: "Dermatologia",
  type: "Aula 1",
  location: null,
  teacher: "Profa. Aline",
  content: null,
  tag: null,
  sourceKey: "dermatologia",
  ...changes,
});

const existing = (changes: Partial<Parameters<typeof diffCronograma>[0][number]> = {}) => ({
  ...event(),
  id: "item-1",
  sourceKey: "dermatologia",
  editedManually: false,
  ...changes,
});

describe("diffCronograma", () => {
  it("recognizes a moved event as an update instead of an add and removal", () => {
    const moved = event({
      date: "2026-08-03",
      startsAt: new Date("2026-08-03T11:00:00.000Z"),
      endsAt: new Date("2026-08-03T13:00:00.000Z"),
    });

    expect(diffCronograma([existing()], [moved])).toEqual({
      added: [],
      updated: [{ itemId: "item-1", event: moved }],
      removedIds: [],
      conflicts: [],
    });
  });

  it("requires an explicit conflict choice for manual edits that change or disappear", () => {
    const manuallyEdited = existing({ editedManually: true });
    const changed = event({ location: "Sala 4" });
    const changedDiff = diffCronograma([manuallyEdited], [changed]);
    expect(changedDiff.conflicts).toEqual([
      { itemId: "item-1", title: "Dermatologia", kind: "changed", proposedEvent: changed },
    ]);
    expect(diffCronograma([manuallyEdited], []).conflicts[0]).toMatchObject({ kind: "removed", proposedEvent: null });
  });

  it("matches duplicate classes to the closest occurrence", () => {
    const morning = existing({ id: "morning" });
    const afternoon = existing({ id: "afternoon", startsAt: new Date("2026-08-01T17:00:00.000Z") });
    const changedMorning = event({ location: "Sala 1" });
    const changedAfternoon = event({
      startsAt: new Date("2026-08-01T17:00:00.000Z"),
      endsAt: new Date("2026-08-01T19:00:00.000Z"),
      location: "Sala 2",
    });

    expect(diffCronograma([morning, afternoon], [changedAfternoon, changedMorning]).updated.map(({ itemId }) => itemId)).toEqual([
      "afternoon",
      "morning",
    ]);
  });
});