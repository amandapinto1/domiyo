type Timed = { startTime: string; endTime: string };

export type PlacedItem<T extends Timed> = {
  item: T;
  /** Minutes from the top of the grid. */
  top: number;
  duration: number;
  /** Side-by-side position among overlapping items. */
  lane: number;
  lanes: number;
};

const DEFAULT_FIRST_HOUR = 7;
const DEFAULT_LAST_HOUR = 20;

export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Whole hours shown by the week grid: 07:00–20:00, widened to fit every item. */
export function hourRange(items: Timed[]): { firstHour: number; lastHour: number } {
  const starts = items.map((item) => Math.floor(minutesOf(item.startTime) / 60));
  const ends = items.map((item) => Math.ceil(minutesOf(item.endTime) / 60));
  return {
    firstHour: Math.min(DEFAULT_FIRST_HOUR, ...starts),
    lastHour: Math.max(DEFAULT_LAST_HOUR, ...ends),
  };
}

/** Positions one day's items; overlapping items share the column in lanes. */
export function layoutDay<T extends Timed>(items: T[], firstHour: number): PlacedItem<T>[] {
  const sorted = [...items].sort(
    (first, second) =>
      minutesOf(first.startTime) - minutesOf(second.startTime) || minutesOf(first.endTime) - minutesOf(second.endTime),
  );
  const placed: PlacedItem<T>[] = [];
  let cluster: PlacedItem<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const entry of cluster) entry.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    const start = minutesOf(item.startTime);
    const end = minutesOf(item.endTime);
    if (start >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) lane = laneEnds.push(end) - 1;
    else laneEnds[lane] = end;
    clusterEnd = Math.max(clusterEnd, end);

    const entry = { item, top: start - firstHour * 60, duration: end - start, lane, lanes: 1 };
    cluster.push(entry);
    placed.push(entry);
  }
  closeCluster();
  return placed;
}
