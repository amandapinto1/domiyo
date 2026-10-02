import "server-only";
import { z } from "zod";
import { addDays, APP_TIME_ZONE, calendarDateIn, timeIn, weekOf, zonedTimeToUtc, type WeekDay } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { requireCurrentMembership } from "@/server/auth";
import { listAgendaItems, listHouseholdAgendas, type HouseholdAgenda } from "@/server/agendas";
import { parseSelectedAgendas } from "../_components/agenda-selection";

export type AgendaOption = { id: string; name: string; ownerFirstName: string };

export type ItemOwner = { name: string; initials: string; photoUrl: string | null };

/** Times are "HH:mm" and `date` is "YYYY-MM-DD", both in the app time zone. */
export type AgendaItemView = {
  id: string;
  agendaId: string;
  agendaName: string;
  owner: ItemOwner;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  title: string;
  type: string | null;
  location: string | null;
  teacher: string | null;
  content: string | null;
  isImported: boolean;
};

export type AgendaView = {
  householdId: string;
  today: string;
  selectedDay: string;
  week: WeekDay[];
  agendas: AgendaOption[];
  selectedAgendaIds: string[];
  /** The signed-in member's own agenda, preselected for new items. */
  ownAgendaId: string | null;
  /** Every item of the selected agendas in the week of `selectedDay`. */
  items: AgendaItemView[];
};

const daySchema = z.iso.date();

function initials(firstName: string, surname: string): string {
  return [firstName, surname]
    .map((name) => Array.from(name.trim())[0] ?? "")
    .join("")
    .toUpperCase();
}

function toOwner(agenda: HouseholdAgenda): ItemOwner {
  const { ownerUserId, ownerFirstName, ownerSurname, ownerPhotoUpdatedAt } = agenda;
  return {
    name: `${ownerFirstName} ${ownerSurname}`.trim(),
    initials: initials(ownerFirstName, ownerSurname),
    photoUrl: ownerPhotoUpdatedAt ? ROUTES.userPhoto(ownerUserId, ownerPhotoUpdatedAt.getTime()) : null,
  };
}

/** Agenda for the signed-in member: the household's agendas and the selected week's items. */
export async function getAgendaView(params: {
  day: string | string[] | undefined;
  agendas: string | string[] | undefined;
}): Promise<AgendaView> {
  const { householdId, userId } = await requireCurrentMembership();
  const today = calendarDateIn(APP_TIME_ZONE);
  const requestedDay = daySchema.safeParse(params.day);
  const selectedDay = requestedDay.success ? requestedDay.data : today;
  const week = weekOf(selectedDay);

  const householdAgendas = await listHouseholdAgendas(householdId);
  const selectedAgendaIds = parseSelectedAgendas(
    params.agendas,
    householdAgendas.map((agenda) => agenda.id),
  );
  const records = await listAgendaItems(
    householdId,
    selectedAgendaIds,
    zonedTimeToUtc(week[0].date, "00:00", APP_TIME_ZONE),
    zonedTimeToUtc(addDays(week[6].date, 1), "00:00", APP_TIME_ZONE),
  );

  const agendaById = new Map(householdAgendas.map((agenda) => [agenda.id, agenda]));
  const items = records.flatMap((record): AgendaItemView[] => {
    const agenda = agendaById.get(record.agendaId);
    if (!agenda) return [];
    return [
      {
        id: record.id,
        agendaId: record.agendaId,
        agendaName: agenda.name,
        owner: toOwner(agenda),
        date: calendarDateIn(APP_TIME_ZONE, record.startsAt),
        startTime: timeIn(APP_TIME_ZONE, record.startsAt),
        endTime: timeIn(APP_TIME_ZONE, record.endsAt),
        color: record.color,
        title: record.title,
        type: record.type,
        location: record.location,
        teacher: record.teacher,
        content: record.content,
        isImported: record.source === "imported",
      },
    ];
  });

  return {
    householdId,
    today,
    selectedDay,
    week,
    agendas: householdAgendas.map(({ id, name, ownerFirstName }) => ({ id, name, ownerFirstName })),
    selectedAgendaIds,
    ownAgendaId: householdAgendas.find((agenda) => agenda.ownerUserId === userId)?.id ?? null,
    items,
  };
}
