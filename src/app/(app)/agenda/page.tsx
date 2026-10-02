import type { Metadata } from "next";
import type { SearchParams } from "@/lib/routes";
import { AGENDAS_PARAM } from "./_components/agenda-item-schema";
import { AgendaContent } from "./_components/agenda-content";
import { getAgendaView } from "./_data-access/get-agenda-view";

export const metadata: Metadata = { title: "Agenda · Domiyo" };

export default async function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = await getAgendaView({ day: params.day, agendas: params[AGENDAS_PARAM] });
  return <AgendaContent view={view} />;
}
