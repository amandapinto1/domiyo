import type { AgendaItemView } from "../_data-access/get-home-view";

export type TimelineRow = { kind: "item"; item: AgendaItemView } | { kind: "free"; time: string };

function nextFullHour(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String(minutes === 0 ? hours : hours + 1).padStart(2, "0")}:00`;
}

/** Items in start order, with a free-slot marker at the first full hour after an item when the next one starts later. */
export function buildTimelineRows(items: AgendaItemView[]): TimelineRow[] {
  const sorted = [...items].sort((first, second) => first.startTime.localeCompare(second.startTime));

  return sorted.flatMap((item, index): TimelineRow[] => {
    const row: TimelineRow = { kind: "item", item };
    const next = sorted[index + 1];
    const freeHour = nextFullHour(item.endTime);
    return next && freeHour < next.startTime ? [row, { kind: "free", time: freeHour }] : [row];
  });
}
