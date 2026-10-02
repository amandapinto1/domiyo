import { z } from "zod";
import { APP_TIME_ZONE, zonedTimeToUtc } from "@/lib/dates";
import type { AgendaItemInput } from "@/server/agendas";
import type { AgendaItemValues } from "../_components/agenda-item-schema";

/** Form values (wall-clock date and times in the app time zone) as stored instants and nullable fields. */
export function toItemInput(values: AgendaItemValues): AgendaItemInput {
  return {
    startsAt: zonedTimeToUtc(values.date, values.startTime, APP_TIME_ZONE),
    endsAt: zonedTimeToUtc(values.date, values.endTime, APP_TIME_ZONE),
    title: values.title,
    type: values.type || null,
    location: values.location || null,
  };
}

/** Field errors keyed by form field, from an input shaped `{ ..., values: {...} }`. */
export function valueErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] === "values" ? issue.path[1] : issue.path[0]);
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}
