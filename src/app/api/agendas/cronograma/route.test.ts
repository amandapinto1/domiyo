import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  requireHouseholdMember: vi.fn(),
  getMembership: vi.fn(),
  isAgendaInHousehold: vi.fn(),
  isCronogramaReadInProgress: vi.fn(),
  consumeCronogramaUpload: vi.fn(),
  savePendingCronogramaImport: vi.fn(),
  completePendingCronogramaImport: vi.fn(),
  failPendingCronogramaImport: vi.fn(),
  parseCronogramaPdf: vi.fn(),
  tasks: [] as Array<() => Promise<void>>,
}));

vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => void mocks.tasks.push(task) }));
vi.mock("@/server/auth", () => ({ requireSession: mocks.requireSession, requireHouseholdMember: mocks.requireHouseholdMember }));
vi.mock("@/server/households", () => ({ getMembership: mocks.getMembership }));
vi.mock("@/server/cronograma", () => ({
  isAgendaInHousehold: mocks.isAgendaInHousehold,
  isCronogramaReadInProgress: mocks.isCronogramaReadInProgress,
  consumeCronogramaUpload: mocks.consumeCronogramaUpload,
  savePendingCronogramaImport: mocks.savePendingCronogramaImport,
  completePendingCronogramaImport: mocks.completePendingCronogramaImport,
  failPendingCronogramaImport: mocks.failPendingCronogramaImport,
}));
vi.mock("@/server/cronograma/claude", () => ({
  CronogramaAiError: class CronogramaAiError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  },
  parseCronogramaPdf: mocks.parseCronogramaPdf,
}));

import { CronogramaAiError } from "@/server/cronograma/claude";
import { POST } from "./route";

const AGENDA_ID = "2b65d9d3-530b-4a3a-9bc5-2e071dedbd78";

function upload(options: { origin?: string; pdf?: string; agendaId?: string } = {}) {
  const { origin = "http://localhost:3000", pdf = "%PDF-1.7 test", agendaId = AGENDA_ID } = options;
  const form = new FormData();
  form.set("agendaId", agendaId);
  form.set("file", new File([pdf], "cronograma.pdf", { type: "application/pdf" }));
  return new Request("http://localhost:3000/api/agendas/cronograma", {
    method: "POST",
    body: form,
    headers: { origin, "content-length": "1000" },
  });
}

const model = {
  title: "Cronograma T41",
  weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [{
    subject: "Dermatologia", startTime: "08:00", endTime: "09:00", color: "#AABBCC",
    type: null, location: null, teacher: null, content: null, tag: null, sideBySide: false,
  }] }] }],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_PUBLIC_URL", "");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.tasks.length = 0;
  mocks.requireSession.mockResolvedValue({ user: { id: "user-1" } });
  mocks.getMembership.mockResolvedValue({ householdId: "house-a" });
  mocks.requireHouseholdMember.mockResolvedValue({ householdId: "house-a", userId: "user-1" });
  mocks.isAgendaInHousehold.mockResolvedValue(true);
  mocks.isCronogramaReadInProgress.mockResolvedValue(false);
  mocks.consumeCronogramaUpload.mockResolvedValue(true);
  mocks.savePendingCronogramaImport.mockResolvedValue("pending-1");
  mocks.failPendingCronogramaImport.mockResolvedValue(undefined);
});

describe("POST /api/agendas/cronograma", () => {
  it("rejects a foreign origin before touching the session", async () => {
    const response = await POST(upload({ origin: "https://evil.example" }));

    expect(response.status).toBe(403);
    expect(mocks.requireSession).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("does nothing without a session", async () => {
    mocks.requireSession.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(POST(upload())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.consumeCronogramaUpload).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("answers 404 for a user without a household", async () => {
    mocks.getMembership.mockResolvedValue(null);

    const response = await POST(upload());

    expect(response.status).toBe(404);
    expect(mocks.requireHouseholdMember).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("checks the agenda against the member's own household and never reads or charges for another household's agenda", async () => {
    mocks.isAgendaInHousehold.mockResolvedValue(false);

    const response = await POST(upload());

    expect(mocks.isAgendaInHousehold).toHaveBeenCalledWith("house-a", AGENDA_ID);
    expect(response.status).toBe(404);
    expect(mocks.consumeCronogramaUpload).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
    expect(mocks.tasks).toHaveLength(0);
  });

  it("refuses a second upload while a read is in progress, without spending the rate limit", async () => {
    mocks.isCronogramaReadInProgress.mockResolvedValue(true);

    const response = await POST(upload());

    expect(response.status).toBe(409);
    expect(mocks.consumeCronogramaUpload).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("rejects a file without the PDF signature before spending the rate limit", async () => {
    const response = await POST(upload({ pdf: "not a pdf" }));

    expect(response.status).toBe(415);
    expect(mocks.consumeCronogramaUpload).not.toHaveBeenCalled();
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("answers 429 with Retry-After when the per-user limit is reached", async () => {
    mocks.consumeCronogramaUpload.mockResolvedValue(false);

    const response = await POST(upload());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(mocks.savePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("stores the PDF for the member's household, answers 202 and reads in the background", async () => {
    mocks.parseCronogramaPdf.mockResolvedValue(model);

    const response = await POST(upload());

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "reading" });
    expect(mocks.savePendingCronogramaImport).toHaveBeenCalledWith(expect.objectContaining({
      householdId: "house-a",
      agendaId: AGENDA_ID,
      userId: "user-1",
    }));
    expect(mocks.consumeCronogramaUpload).toHaveBeenCalledWith("user-1");
    expect(mocks.parseCronogramaPdf).not.toHaveBeenCalled();
    expect(mocks.tasks).toHaveLength(1);

    await mocks.tasks[0]();

    expect(mocks.completePendingCronogramaImport).toHaveBeenCalledWith(expect.objectContaining({
      householdId: "house-a",
      agendaId: AGENDA_ID,
      pendingId: "pending-1",
    }));
    expect(mocks.failPendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("records the failure code when the read fails", async () => {
    mocks.parseCronogramaPdf.mockRejectedValue(new CronogramaAiError("timeout"));

    await POST(upload());
    await mocks.tasks[0]();

    expect(mocks.failPendingCronogramaImport).toHaveBeenCalledWith({ agendaId: AGENDA_ID, pendingId: "pending-1", code: "timeout" });
    expect(mocks.completePendingCronogramaImport).not.toHaveBeenCalled();
  });

  it("records no_events when the PDF yields no classes", async () => {
    mocks.parseCronogramaPdf.mockResolvedValue({ ...model, weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [] }] }] });

    await POST(upload());
    await mocks.tasks[0]();

    expect(mocks.failPendingCronogramaImport).toHaveBeenCalledWith({ agendaId: AGENDA_ID, pendingId: "pending-1", code: "no_events" });
    expect(mocks.completePendingCronogramaImport).not.toHaveBeenCalled();
  });
});
