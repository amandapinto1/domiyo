import type { AgendaItemView } from "../_data-access/get-agenda-view";
import { groupBySlot } from "./day-groups";
import { ItemCard } from "./item-card";
import { minutesOf } from "./week-layout";

const ROW_GRID = "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3";

function nextFullHour(time: string): string {
  return `${String(Math.ceil(minutesOf(time) / 60)).padStart(2, "0")}:00`;
}

type DayListProps = { items: AgendaItemView[]; onOpen: (item: AgendaItemView) => void };

/** Mobile timeline of the selected day: items at the same time share one row, with a free-slot marker between rows that leave a gap. */
export function DayList({ items, onOpen }: DayListProps) {
  const groups = groupBySlot(items);
  return (
    <ol aria-label="Compromissos do dia" className="mt-6 flex flex-col gap-3">
      {groups.map((group, index) => {
        const first = group[0];
        const next = groups[index + 1]?.[0];
        const freeHour = nextFullHour(first.endTime);
        return [
          <li key={first.id} className={ROW_GRID}>
            <span className="pt-3 text-body-small text-text-secondary">{first.startTime}</span>
            {group.length > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                {group.map((item) => (
                  <ItemCard key={item.id} item={item} layout="list" compact onOpen={() => onOpen(item)} />
                ))}
              </div>
            ) : (
              <ItemCard item={first} layout="list" onOpen={() => onOpen(first)} />
            )}
          </li>,
          next && freeHour < next.startTime ? (
            <li key={`free-${first.id}`} className={`${ROW_GRID} items-center`}>
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
