import { describe, expect, it } from "vitest";
import { cronogramaModelSchema, toCronogramaEvents } from "./schema";

const item = {
  subject: "Dermatologia",
  startTime: "08:00",
  endTime: "10:00",
  color: "#a0b1c2",
  type: "Aula 1",
  location: null,
  teacher: "Profa. Aline",
  content: "Propedêutica da Pele",
};

describe("cronograma schema", () => {
  it("assigns a new year when the printed schedule crosses December to January", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [
        { number: 1, days: [{ day: 30, month: 12, items: [item] }] },
        { number: 2, days: [{ day: 2, month: 1, items: [item] }] },
      ],
    });

    const events = toCronogramaEvents(parsed, 2026);

    expect(events.map(({ date }) => date)).toEqual(["2026-12-30", "2027-01-02"]);
    expect(events[0].startsAt.toISOString()).toBe("2026-12-30T11:00:00.000Z");
    expect(events[0].color).toBe("#A0B1C2");
  });

  it("rejects impossible calendar dates and invalid times", () => {
    const invalidDate = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 30, month: 2, items: [item] }] }],
    });
    expect(() => toCronogramaEvents(invalidDate, 2026)).toThrow("data inválida");

    expect(
      cronogramaModelSchema.safeParse({
        title: "Cronograma T41",
        weeks: [{ number: 1, days: [{ day: 1, month: 2, items: [{ ...item, startTime: "8h" }] }] }],
      }).success,
    ).toBe(false);
  });

  it("gives the same source key to the same class when it moves", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{
        number: 1,
        days: [
          { day: 1, month: 8, items: [item] },
          { day: 2, month: 8, items: [{ ...item, startTime: "14:00", endTime: "16:00" }] },
        ],
      }],
    });

    const events = toCronogramaEvents(parsed, 2026);
    expect(events[0].sourceKey).toBe(events[1].sourceKey);
  });
});