"use server";

import { z } from "zod";
import { addDays, APP_TIME_ZONE, calendarDateIn, monthGrid, zonedTimeToUtc } from "@/lib/dates";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { listItemStarts } from "@/server/agendas";

const inputSchema = z.object({ householdId: z.uuid(), agendaIds: z.array(z.uuid()).max(50), month: z.iso.date() });

/** Days ("YYYY-MM-DD") with at least one item in the month grid of `month`, for the "Escolher data" dots. */
export async function getEventDaysAction(input: unknown): Promise<string[]> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return [];
  const { householdId } = await requireHouseholdMember(parsed.data.householdId);

  const weeks = monthGrid(parsed.data.month);
  const firstDay = weeks[0][0].date;
  const lastDay = weeks[weeks.length - 1][6].date;
  try {
    const starts = await listItemStarts(
      householdId,
      parsed.data.agendaIds,
      zonedTimeToUtc(firstDay, "00:00", APP_TIME_ZONE),
      zonedTimeToUtc(addDays(lastDay, 1), "00:00", APP_TIME_ZONE),
    );
    return [...new Set(starts.map((start) => calendarDateIn(APP_TIME_ZONE, start)))];
  } catch {
    console.error("getEventDaysAction failed");
    return [];
  }
}
