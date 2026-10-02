import type { AgendaItemView } from "../_data-access/get-agenda-view";
import { ItemCard } from "./item-card";
import { minutesOf } from "./week-layout";

const ROW_GRID = "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3";

function nextFullHour(time: string): string {
  return `${String(Math.ceil(minutesOf(time) / 60)).padStart(2, "0")}:00`;
}

type DayListProps = { items: AgendaItemView[]; onOpen: (item: AgendaItemView) => void };

/** Mobile timeline of the selected day, with a free-slot marker between items that leave a gap. */
export function DayList({ items, onOpen }: DayListProps) {
  const sorted = [...items].sort((first, second) => first.startTime.localeCompare(second.startTime));
  return (
    <ol aria-label="Compromissos do dia" className="mt-6 flex flex-col gap-3">
      {sorted.map((item, index) => {
        const next = sorted[index + 1];
        const freeHour = nextFullHour(item.endTime);
        return [
          <li key={item.id} className={ROW_GRID}>
            <span className="pt-3 text-body-small text-text-secondary">{item.startTime}</span>
            <ItemCard item={item} layout="list" onOpen={() => onOpen(item)} />
          </li>,
          next && freeHour < next.startTime ? (
            <li key={`free-${item.id}`} className={`${ROW_GRID} items-center`}>
              <span className="text-body-small text-text-secondary">
                {freeHour}
                <span className="sr-only"> livre</span>
              </span>
              <span aria-hidden="true" className="border-t border-dashed border-lavender-600" />
            </li>
          ) : null,
        ];
      })}
    </ol>
  );
}
