import { cronogramaSourceKey, type CronogramaEvent } from "./schema";

export type ExistingCronogramaEvent = Omit<CronogramaEvent, "sourceKey"> & {
  id: string;
  sourceKey: string | null;
  editedManually: boolean;
};

export type CronogramaConflict = {
  itemId: string;
  title: string;
  kind: "changed" | "removed";
  proposedEvent: CronogramaEvent | null;
};

export type CronogramaDiff = {
  added: CronogramaEvent[];
  updated: Array<{ itemId: string; event: CronogramaEvent }>;
  removedIds: string[];
  conflicts: CronogramaConflict[];
};

function eventSourceKey(event: ExistingCronogramaEvent): string {
  return event.sourceKey ?? cronogramaSourceKey({
    subject: event.title,
    type: event.type,
    location: event.location,
    teacher: event.teacher,
    content: event.content,
    tag: event.tag,
    sideBySide: false,
    startTime: "00:00",
    endTime: "00:01",
    color: event.color,
  });
}

function differs(current: ExistingCronogramaEvent, next: CronogramaEvent): boolean {
  return (
    current.startsAt.getTime() !== next.startsAt.getTime() ||
    current.endsAt.getTime() !== next.endsAt.getTime() ||
    current.color !== next.color ||
    current.title !== next.title ||
    current.type !== next.type ||
    current.location !== next.location ||
    current.teacher !== next.teacher ||
    current.content !== next.content ||
    current.tag !== next.tag
  );
}

/** Matches repeated classes by stable content identity, preferring the nearest time for duplicates. */
export function diffCronograma(
  existingEvents: ExistingCronogramaEvent[],
  nextEvents: CronogramaEvent[],
): CronogramaDiff {
  const remaining = new Map(existingEvents.map((event) => [event.id, event]));
  const added: CronogramaEvent[] = [];
  const updated: CronogramaDiff["updated"] = [];
  const conflicts: CronogramaConflict[] = [];

  for (const next of nextEvents) {
    const candidates = [...remaining.values()].filter((event) => eventSourceKey(event) === next.sourceKey);
    const matched = candidates.sort(
      (left, right) =>
        Math.abs(left.startsAt.getTime() - next.startsAt.getTime()) -
        Math.abs(right.startsAt.getTime() - next.startsAt.getTime()),
    )[0];

    if (!matched) {
      added.push(next);
      continue;
    }
    remaining.delete(matched.id);
    if (!differs(matched, next)) continue;
    if (matched.editedManually) {
      conflicts.push({ itemId: matched.id, title: matched.title, kind: "changed", proposedEvent: next });
    } else {
      updated.push({ itemId: matched.id, event: next });
    }
  }

  const removedIds: string[] = [];
  for (const event of remaining.values()) {
    if (event.editedManually) {
      conflicts.push({ itemId: event.id, title: event.title, kind: "removed", proposedEvent: null });
    } else {
      removedIds.push(event.id);
    }
  }

  return { added, updated, removedIds, conflicts };
}