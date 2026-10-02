/** Items with the same start and end share one row of the day timeline, side by side, in a stable order. */
export function groupBySlot<T extends { startTime: string; endTime: string }>(items: T[]): T[][] {
  const sorted = [...items].sort(
    (first, second) => first.startTime.localeCompare(second.startTime) || first.endTime.localeCompare(second.endTime),
  );
  const groups: T[][] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    if (last && last[0].startTime === item.startTime && last[0].endTime === item.endTime) last.push(item);
    else groups.push([item]);
  }
  return groups;
}
