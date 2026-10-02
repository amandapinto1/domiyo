import { describe, expect, it } from "vitest";
import { pendingReadPhase, READ_STALE_MS, type PendingReadRow } from "./read-phase";

const now = new Date("2026-10-02T12:00:00.000Z");
const row = (changes: Partial<PendingReadRow> = {}): PendingReadRow => ({
  failure: null,
  hasSchedule: false,
  createdAt: new Date(now.getTime() - 60_000),
  expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
  ...changes,
});

describe("pendingReadPhase", () => {
  it("is reading while the background read has no result yet", () => {
    expect(pendingReadPhase(row(), now)).toEqual({ phase: "reading" });
  });

  it("is ready once the schedule is stored", () => {
    expect(pendingReadPhase(row({ hasSchedule: true }), now)).toEqual({ phase: "ready" });
  });

  it("reports the stored failure code, even if a schedule were present", () => {
    expect(pendingReadPhase(row({ failure: "timeout", hasSchedule: true }), now)).toEqual({ phase: "failed", code: "timeout" });
  });

  it("treats a read with no result after the stale window as interrupted", () => {
    const stale = row({ createdAt: new Date(now.getTime() - READ_STALE_MS - 1000) });
    expect(pendingReadPhase(stale, now)).toEqual({ phase: "failed", code: "interrupted" });
  });

  it("ignores a ready import that outlived its stale window", () => {
    const old = row({ hasSchedule: true, createdAt: new Date(now.getTime() - 2 * READ_STALE_MS) });
    expect(pendingReadPhase(old, now)).toEqual({ phase: "ready" });
  });

  it("is none when missing or expired", () => {
    expect(pendingReadPhase(undefined, now)).toEqual({ phase: "none" });
    expect(pendingReadPhase(row({ expiresAt: new Date(now.getTime() - 1) }), now)).toEqual({ phase: "none" });
  });
});
