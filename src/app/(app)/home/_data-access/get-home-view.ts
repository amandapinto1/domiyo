import "server-only";
import { addDays, APP_TIME_ZONE, timeIn, zonedTimeToUtc } from "@/lib/dates";
import { requireCurrentMembership, requireSession } from "@/server/auth";
import { listAgendaItems, listHouseholdAgendas } from "@/server/agendas";

/** Times are "HH:mm" in the app time zone; `color` is the subject's "#RRGGBB" from the imported legend. */
export type AgendaItemView = {
  id: string;
  subject: string;
  type: string | null;
  startTime: string;
  endTime: string;
  color: string;
};

export type HomeView = { firstName: string; items: AgendaItemView[] };

/** Início for the signed-in member: their first name and their own agenda's items on `day` ("YYYY-MM-DD"). */
export async function getHomeView(day: string): Promise<HomeView> {
  const session = await requireSession();
  const { householdId, userId } = await requireCurrentMembership();
  const ownAgendaIds = (await listHouseholdAgendas(householdId))
    .filter((agenda) => agenda.ownerUserId === userId)
    .map((agenda) => agenda.id);
  const records = await listAgendaItems(
    householdId,
    ownAgendaIds,
    zonedTimeToUtc(day, "00:00", APP_TIME_ZONE),
    zonedTimeToUtc(addDays(day, 1), "00:00", APP_TIME_ZONE),
  );

  return {
    firstName: session.user.name,
    items: records.map((record) => ({
      id: record.id,
      subject: record.title,
      type: record.type,
      startTime: timeIn(APP_TIME_ZONE, record.startsAt),
      endTime: timeIn(APP_TIME_ZONE, record.endsAt),
      color: record.color,
    })),
  };
}
