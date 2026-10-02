import { createHash } from "node:crypto";
import { z } from "zod";
import { APP_TIME_ZONE, zonedTimeToUtc } from "@/lib/dates";

const nullableText = (maximum: number) => z.string().trim().max(maximum).nullable();
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const cronogramaModelSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
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
                            subject: z.string().trim().min(1).max(120),
                            startTime: timeSchema,
                            endTime: timeSchema,
                            color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
                            type: nullableText(80),
                            location: nullableText(160),
                            teacher: nullableText(160),
                            content: nullableText(500),
                          })
                          .strict(),
                      )
                      .max(80),
                  })
                  .strict(),
              )
              .min(1)
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
  sourceKey: string;
};

function dateFor(day: number, month: number, year: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Cronograma contém uma data inválida.");
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sourceKey(item: CronogramaModel["weeks"][number]["days"][number]["items"][number]): string {
  const identity = [item.subject, item.type, item.location, item.teacher, item.content]
    .map((value) => value?.normalize("NFKC").trim().toLocaleLowerCase("pt-BR") ?? "")
    .join("\u001f");
  return createHash("sha256").update(identity).digest("hex");
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

      for (const item of day.items) {
        if (item.endTime <= item.startTime) throw new Error("Cronograma contém um horário inválido.");
        events.push({
          date,
          startsAt: zonedTimeToUtc(date, item.startTime, APP_TIME_ZONE),
          endsAt: zonedTimeToUtc(date, item.endTime, APP_TIME_ZONE),
          color: item.color.toUpperCase(),
          title: item.subject,
          type: item.type,
          location: item.location,
          teacher: item.teacher,
          content: item.content,
          sourceKey: sourceKey(item),
        });
      }
    }
  }

  return events;
}