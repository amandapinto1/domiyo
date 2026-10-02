import { createHash } from "node:crypto";
import { z } from "zod";
import { APP_TIME_ZONE, zonedTimeToUtc } from "../../lib/dates";

// Descriptive text is clipped, not rejected: a long teacher list should not fail the whole import.
const nullableText = (maximum: number) => z.string().transform((value) => value.trim().slice(0, maximum)).nullable();
const requiredText = (maximum: number) => z.string().trim().min(1).transform((value) => value.slice(0, maximum));
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
// Same lavender as manual items; used when the legend color is missing or unreadable.
export const FALLBACK_COLOR = "#B9B8E1";
const colorSchema = z.string().transform((value) => (/^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : FALLBACK_COLOR));

const TAG_PATTERN = /^(NAF|AIM ?\d*|CBL|TBL|OSCE)$/;

/** Only the known methodology labels become tags; anything else is dropped. */
export function normalizeTag(value: string | null | undefined): string | null {
  const text = value?.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase() ?? "";
  return TAG_PATTERN.test(text) ? text.replace(/^AIM(?=\d)/, "AIM ") : null;
}

export const cronogramaModelSchema = z
  .object({
    title: requiredText(160),
    weeks: z
      .array(
        z
          .object({
            number: z.number().int().positive(),
            days: z
              .array(
                z
                  .object({
                    day: z.number().int().min(1).max(31),
                    month: z.number().int().min(1).max(12),
                    items: z
                      .array(
                        z
                          .object({
                            subject: requiredText(120),
                            startTime: timeSchema,
                            endTime: timeSchema,
                            color: colorSchema,
                            type: nullableText(80),
                            location: nullableText(160),
                            teacher: nullableText(160),
                            content: nullableText(500),
                            tag: z.string().nullable().optional().transform((value) => normalizeTag(value)),
                            sideBySide: z.boolean().nullish().transform((value) => value === true),
                          })
                          .strict(),
                      )
                      .max(80),
                  })
                  .strict(),
              )
              .max(7),
          })
          .strict(),
      )
      .min(1)
      .max(52),
  })
  .strict();

export type CronogramaModel = z.infer<typeof cronogramaModelSchema>;

export type CronogramaEvent = {
  date: string;
  startsAt: Date;
  endsAt: Date;
  color: string;
  title: string;
  type: string | null;
  location: string | null;
  teacher: string | null;
  content: string | null;
  tag: string | null;
  sourceKey: string;
};

function dateFor(day: number, month: number, year: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Cronograma contém uma data inválida.");
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function cronogramaSourceKey(item: CronogramaModel["weeks"][number]["days"][number]["items"][number]): string {
  const identity = [item.subject, item.type]
    .map((value) => value?.normalize("NFKC").trim().toLocaleLowerCase("pt-BR") ?? "")
    .join("\u001f");
  return createHash("sha256").update(identity).digest("hex");
}

type CronogramaItem = CronogramaModel["weeks"][number]["days"][number]["items"][number];

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Classes stacked in the same slot of a day are split into equal consecutive parts, in printed order; side-by-side cells run at the same time. */
export function splitSharedSlots(items: CronogramaItem[]): CronogramaItem[] {
  const slotOf = (item: CronogramaItem) => `${item.startTime}-${item.endTime}`;
  const totals = new Map<string, number>();
  for (const item of items) if (!item.sideBySide) totals.set(slotOf(item), (totals.get(slotOf(item)) ?? 0) + 1);

  const seen = new Map<string, number>();
  return items.map((item) => {
    if (item.sideBySide) return item;
    const slot = slotOf(item);
    const total = totals.get(slot) ?? 1;
    const index = seen.get(slot) ?? 0;
    seen.set(slot, index + 1);
    const start = toMinutes(item.startTime);
    const length = toMinutes(item.endTime) - start;
    if (total === 1 || length < total) return item;
    return {
      ...item,
      startTime: toTime(start + Math.round((length * index) / total)),
      endTime: toTime(start + Math.round((length * (index + 1)) / total)),
    };
  });
}

/** Assigns years in printed order and converts the institution's wall-clock times to UTC. */
export function toCronogramaEvents(input: CronogramaModel, firstYear = new Date().getFullYear()): CronogramaEvent[] {
  let year = firstYear;
  let previousMonth: number | null = null;
  const events: CronogramaEvent[] = [];

  for (const week of input.weeks) {
    for (const day of week.days) {
      if (previousMonth !== null && day.month < previousMonth) year += 1;
      previousMonth = day.month;
      const date = dateFor(day.day, day.month, year);

      for (const item of splitSharedSlots(day.items)) {
        if (item.endTime <= item.startTime) throw new Error("Cronograma contém um horário inválido.");
        // A tag printed as the class type (e.g. "TBL") is shown once, as the tag.
        const tag = item.tag ?? normalizeTag(item.type);
        events.push({
          date,
          startsAt: zonedTimeToUtc(date, item.startTime, APP_TIME_ZONE),
          endsAt: zonedTimeToUtc(date, item.endTime, APP_TIME_ZONE),
          color: item.color.toUpperCase(),
          title: item.subject,
          type: tag !== null && normalizeTag(item.type) === tag ? null : item.type,
          location: item.location,
          teacher: item.teacher,
          content: item.content,
          tag,
          sourceKey: cronogramaSourceKey(item),
        });
      }
    }
  }

  return events;
}