/** Selected agendas from `?agendas=`: unknown ids are dropped, and nothing valid means every agenda. */
export function parseSelectedAgendas(param: string | string[] | undefined, agendaIds: string[]): string[] {
  const requested = typeof param === "string" ? param.split(",") : [];
  const selected = agendaIds.filter((id) => requested.includes(id));
  return selected.length > 0 ? selected : agendaIds;
}

/** Toggles one agenda; the last selected agenda cannot be deselected (docs/PRD.md). */
export function toggleAgenda(selected: string[], agendaIds: string[], id: string): string[] {
  if (!selected.includes(id)) return agendaIds.filter((agendaId) => agendaId === id || selected.includes(agendaId));
  return selected.length === 1 ? selected : selected.filter((agendaId) => agendaId !== id);
}

/** The `agendas` query value, or null when every agenda is selected (the default). */
export function selectionParam(selected: string[], agendaIds: string[]): string | null {
  return selected.length === agendaIds.length ? null : selected.join(",");
}
