import { FOCUS_RING } from "@/components/ui/styles";
import type { AgendaItemView } from "../_data-access/get-agenda-view";
import { OwnersAvatar } from "./owner-avatar";

type ItemCardProps = { item: AgendaItemView; layout: "list" | "grid"; compact?: boolean; onOpen: () => void };

/** Methodology label (NAF, TBL, OSCE...); danger tokens keep white text at 6.3:1 in light and ink text readable in dark. */
function ItemTag({ tag }: { tag: string }) {
  return (
    <span className="shrink-0 rounded-md bg-danger-600 px-2 py-0.5 text-[0.625rem] leading-4 font-semibold text-white dark:bg-danger-300 dark:text-lavender-900">
      {tag}
    </span>
  );
}

/** One agenda item in its subject color; ink.900 text stays readable on the legend colors. `compact` is a list card sharing its row with another. */
export function ItemCard({ item, layout, compact = false, onOpen }: ItemCardProps) {
  const time = `${item.startTime} – ${item.endTime}`;
  const isList = layout === "list";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex size-full cursor-pointer flex-col overflow-hidden text-left text-ink-900 ${FOCUS_RING} ${
        isList ? (compact ? "gap-1 rounded-md px-3 py-3" : "gap-1 rounded-md px-4 py-3") : "gap-0.5 rounded-sm px-2 py-1.5"
      }`}
      style={{ backgroundColor: item.color }}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className={`min-w-0 font-medium ${isList ? (compact ? "text-xs leading-4 wrap-break-words hyphens-auto" : "text-body-small") : "line-clamp-3 text-xs leading-4"}`} lang="pt-BR">
          {item.title}
        </span>
        {isList ? <OwnersAvatar owners={item.owners} /> : null}
      </span>
      <span className={`flex w-full items-center justify-between gap-2 ${isList ? "mt-auto text-body-small" : "text-xs leading-4"}`}>
        <span className="min-w-0 truncate">{isList && item.type && !compact ? `${time} · ${item.type}` : time}</span>
        {isList ? (
          item.tag ? <ItemTag tag={item.tag} /> : null
        ) : (
          <span className="flex shrink-0 items-center gap-1">
            {item.tag ? <ItemTag tag={item.tag} /> : null}
            <OwnersAvatar owners={item.owners} />
          </span>
        )}
      </span>
    </button>
  );
}
