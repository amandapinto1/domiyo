export const READ_STALE_MS = 8 * 60 * 1000;

export type PendingReadRow = {
  failure: string | null;
  hasSchedule: boolean;
  createdAt: Date;
  expiresAt: Date;
};

export type PendingReadPhase =
  | { phase: "none" }
  | { phase: "failed"; code: string }
  | { phase: "reading" }
  | { phase: "ready" };

/** Decides what a pending import row means for the import screen; a read with no result for too long counts as interrupted. */
export function pendingReadPhase(row: PendingReadRow | undefined, now = new Date()): PendingReadPhase {
  if (!row || row.expiresAt <= now) return { phase: "none" };
  if (row.failure) return { phase: "failed", code: row.failure };
  if (row.hasSchedule) return { phase: "ready" };
  if (now.getTime() - row.createdAt.getTime() > READ_STALE_MS) return { phase: "failed", code: "interrupted" };
  return { phase: "reading" };
}
