import { describe, expect, it } from "vitest";
import { cronogramaModelSchema, normalizeTag, splitSharedSlots, toCronogramaEvents } from "./schema";

const item = {
  subject: "Dermatologia",
  startTime: "08:00",
  endTime: "10:00",
  color: "#a0b1c2",
  type: "Aula 1",
  location: null,
  teacher: "Profa. Aline",
  content: "Propedêutica da Pele",
  tag: null,
  sideBySide: false,
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

  it("uses a default color when the legend color is unreadable", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [{ ...item, color: "sem cor" }] }] }],
    });

    expect(toCronogramaEvents(parsed, 2026)[0].color).toBe("#B9B8E1");
  });

  it("clips overlong descriptive text instead of rejecting the schedule", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [{ ...item, teacher: "P".repeat(400) }] }] }],
    });

    expect(parsed.weeks[0].days[0].items[0].teacher).toHaveLength(160);
  });

  it("splits classes that share a slot into equal parts, in printed order", () => {
    const hap = (type: string) => ({ ...item, subject: "HAP VII", type, startTime: "16:00", endTime: "18:00" });
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 2, month: 10, items: [hap("Aula 15"), hap("Aula 16"), { ...item, startTime: "08:00", endTime: "10:00" }] }] }],
    });

    const events = toCronogramaEvents(parsed, 2026);
    const times = events.map(({ type, startsAt, endsAt }) => [type, startsAt.toISOString().slice(11, 16), endsAt.toISOString().slice(11, 16)]);

    // America/Fortaleza is UTC-3.
    expect(times).toEqual([
      ["Aula 15", "19:00", "20:00"],
      ["Aula 16", "20:00", "21:00"],
      ["Aula 1", "11:00", "13:00"],
    ]);
  });

  it("splits a slot among three classes and leaves slots too short to divide untouched", () => {
    const base = { ...item, startTime: "14:00", endTime: "16:00" };
    expect(splitSharedSlots([base, base, base]).map(({ startTime, endTime }) => `${startTime}-${endTime}`)).toEqual([
      "14:00-14:40",
      "14:40-15:20",
      "15:20-16:00",
    ]);

    const tiny = { ...item, startTime: "14:00", endTime: "14:01" };
    expect(splitSharedSlots([tiny, tiny]).map(({ startTime }) => startTime)).toEqual(["14:00", "14:00"]);
  });

  it("keeps only known methodology labels as tags", () => {
    expect(normalizeTag(" osce ")).toBe("OSCE");
    expect(normalizeTag("tbl")).toBe("TBL");
    expect(normalizeTag("AIM2")).toBe("AIM 2");
    expect(normalizeTag("aim 1")).toBe("AIM 1");
    expect(normalizeTag("NAF")).toBe("NAF");
    expect(normalizeTag("Conferência")).toBeNull();
    expect(normalizeTag("TBL Diabetes")).toBeNull();
    expect(normalizeTag(null)).toBeNull();
  });

  it("shows a methodology label once, as the tag, even when it was read as the type", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [
        { ...item, startTime: "08:00", endTime: "09:00", type: "TBL", tag: null },
        { ...item, startTime: "09:00", endTime: "10:00", type: "Aula 7 - TBL", tag: "tbl" },
        { ...item, startTime: "10:00", endTime: "11:00", type: "Conferência", tag: "Aula" },
      ] }] }],
    });

    const events = toCronogramaEvents(parsed, 2026);
    expect(events.map(({ type, tag }) => [type, tag])).toEqual([
      [null, "TBL"],
      ["Aula 7 - TBL", "TBL"],
      ["Conferência", null],
    ]);
  });

  it("keeps side-by-side cells at the same time and still splits stacked ones", () => {
    const night = { ...item, startTime: "18:30", endTime: "21:30" };
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 12, days: [{ day: 22, month: 10, items: [
        { ...night, subject: "Hematologia", sideBySide: true },
        { ...night, subject: "Terapia Intensiva", sideBySide: true },
        { ...item, subject: "HAP VII", type: "Aula 15", startTime: "16:00", endTime: "18:00" },
        { ...item, subject: "HAP VII", type: "Aula 16", startTime: "16:00", endTime: "18:00" },
      ] }] }],
    });

    const events = toCronogramaEvents(parsed, 2026);
    // America/Fortaleza is UTC-3.
    expect(events.map(({ title, type, startsAt, endsAt }) => [title, type === "Aula 1" ? null : type, startsAt.toISOString().slice(11, 16), endsAt.toISOString().slice(11, 16)])).toEqual([
      ["Hematologia", null, "21:30", "00:30"],
      ["Terapia Intensiva", null, "21:30", "00:30"],
      ["HAP VII", "Aula 15", "19:00", "20:00"],
      ["HAP VII", "Aula 16", "20:00", "21:00"],
    ]);
  });

  it("treats a missing sideBySide flag as stacked", () => {
    const { sideBySide: omitted, ...withoutFlag } = item;
    void omitted;
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [withoutFlag, withoutFlag] }] }],
    });

    expect(parsed.weeks[0].days[0].items.every(({ sideBySide }) => sideBySide === false)).toBe(true);
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

  it("keeps event identity when mutable class details change", () => {
    const parsed = cronogramaModelSchema.parse({
      title: "Cronograma T41",
      weeks: [{
        number: 1,
        days: [{ day: 1, month: 8, items: [item, { ...item, teacher: "Prof. Bruno", content: "Novo conteúdo" }] }],
      }],
    });

    const events = toCronogramaEvents(parsed, 2026);
    expect(events[0].sourceKey).toBe(events[1].sourceKey);
  });
});