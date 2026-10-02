import { FOCUS_RING } from "@/components/ui/styles";
import type { AgendaItemView } from "../_data-access/get-agenda-view";
import { OwnerAvatar } from "./owner-avatar";

type ItemCardProps = { item: AgendaItemView; layout: "list" | "grid"; onOpen: () => void };

/** One agenda item in its subject color; ink.900 text stays readable on the legend colors. */
export function ItemCard({ item, layout, onOpen }: ItemCardProps) {
  const time = `${item.startTime} – ${item.endTime}`;
  const isList = layout === "list";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex size-full cursor-pointer flex-col overflow-hidden text-left text-ink-900 ${FOCUS_RING} ${
        isList ? "gap-1 rounded-md px-4 py-3" : "gap-0.5 rounded-sm px-2 py-1.5"
      }`}
      style={{ backgroundColor: item.color }}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className={`min-w-0 font-medium ${isList ? "text-body-small" : "line-clamp-3 text-xs leading-4"}`}>
          {item.title}
        </span>
        {isList ? <OwnerAvatar owner={item.owner} /> : null}
      </span>
      <span className={`flex w-full items-center justify-between gap-1 ${isList ? "text-body-small" : "text-xs leading-4"}`}>
        <span className="min-w-0 truncate">{isList && item.type ? `${time} · ${item.type}` : time}</span>
        {isList ? null : <OwnerAvatar owner={item.owner} />}
      </span>
    </button>
  );
}
