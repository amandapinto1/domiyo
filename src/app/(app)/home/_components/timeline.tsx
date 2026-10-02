import { EmptyDay } from "@/components/ui/empty-day";
import { buildTimelineRows } from "./timeline-rows";
import type { AgendaItemView } from "../_data-access/get-home-view";

const ROW_GRID = "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3";

type TimelineProps = { items: AgendaItemView[] };

/** The selected day's items, outside the agenda card so cards never nest. */
export function Timeline({ items }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="mt-16 flex justify-center">
        <EmptyDay />
      </div>
    );
  }

  return (
    <ol aria-label="Compromissos do dia" className="mt-6 flex flex-col gap-3">
      {buildTimelineRows(items).map((row) =>
        row.kind === "item" ? (
          <li key={row.item.id} className={ROW_GRID}>
            <span className="text-body-small text-text-secondary">{row.item.startTime}</span>
            {/* Subject colors come from the imported PDF legend; ink.900 text passes AA on every sampled color. */}
            <div className="rounded-md px-4 py-3 text-ink-900" style={{ backgroundColor: row.item.color }}>
              <p className="text-body-small font-medium">{row.item.subject}</p>
              <p className="mt-1 text-body-small">
                {row.item.startTime} – {row.item.endTime}
                {row.item.type ? ` · ${row.item.type}` : null}
              </p>
            </div>
          </li>
        ) : (
          <li key={`free-${row.time}`} className={`${ROW_GRID} items-center`}>
            <span className="text-body-small text-text-secondary">
              {row.time}
              <span className="sr-only"> livre</span>
            </span>
            <span aria-hidden="true" className="border-t border-dashed border-lavender-600" />
          </li>
        ),
      )}
    </ol>
  );
}
