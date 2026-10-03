import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireCurrentMembership } from "@/server/auth";
import { listHouseholdAgendas } from "@/server/agendas";
import { getCronogramaImportState, getCurrentCronogramaInfo } from "@/server/cronograma";

const agendaIdSchema = z.uuid();

export async function getCronogramaImportView(agendaIdParam: string | string[] | undefined) {
  const { householdId, userId, canImportPdf } = await requireCurrentMembership();
  if (canImportPdf !== true) notFound();
  const agendas = await listHouseholdAgendas(householdId);
  const ownAgendaId = agendas.find((agenda) => agenda.ownerUserId === userId)?.id ?? null;
  const parsedId = agendaIdSchema.safeParse(agendaIdParam);
  const requestedAgendaId = parsedId.success ? parsedId.data : ownAgendaId;
  const agenda = agendas.find((item) => item.id === requestedAgendaId);
  if (!agenda) notFound();

  const [importState, currentCronograma] = await Promise.all([
    getCronogramaImportState(householdId, agenda.id),
    getCurrentCronogramaInfo(householdId, agenda.id),
  ]);

  return {
    householdId,
    agendas: agendas.map(({ id, name, ownerFirstName }) => ({ id, name, ownerFirstName })),
    agendaId: agenda.id,
    ownAgendaId,
    importState,
    currentCronograma,
  };
}