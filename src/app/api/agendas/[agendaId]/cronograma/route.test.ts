import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  requireHouseholdMember: vi.fn(),
  getMembership: vi.fn(),
  getStoredCronograma: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ requireSession: mocks.requireSession, requireHouseholdMember: mocks.requireHouseholdMember }));
vi.mock("@/server/households", () => ({ getMembership: mocks.getMembership }));
vi.mock("@/server/cronograma", () => ({ getStoredCronograma: mocks.getStoredCronograma }));

import { GET } from "./route";

const AGENDA_ID = "2b65d9d3-530b-4a3a-9bc5-2e071dedbd78";
const call = (agendaId: string) =>
  GET(new Request(`http://localhost:3000/api/agendas/${agendaId}/cronograma`), { params: Promise.resolve({ agendaId }) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.requireSession.mockResolvedValue({ user: { id: "user-1" } });
  mocks.getMembership.mockResolvedValue({ householdId: "house-a" });
  mocks.requireHouseholdMember.mockResolvedValue({ householdId: "house-a", userId: "user-1" });
});

describe("GET /api/agendas/[agendaId]/cronograma", () => {
  it("does nothing without a session", async () => {
    mocks.requireSession.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(call(AGENDA_ID)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.getStoredCronograma).not.toHaveBeenCalled();
  });

  it("answers 404 for a user without a household", async () => {
    mocks.getMembership.mockResolvedValue(null);

    const response = await call(AGENDA_ID);

    expect(response.status).toBe(404);
    expect(mocks.getStoredCronograma).not.toHaveBeenCalled();
  });

  it("rejects an id that is not a UUID before querying", async () => {
    const response = await call("1 OR 1=1");

    expect(response.status).toBe(404);
    expect(mocks.getStoredCronograma).not.toHaveBeenCalled();
  });

  it("looks the PDF up only within the member's own household, so another household's agenda is a 404", async () => {
    mocks.getStoredCronograma.mockResolvedValue(null);

    const response = await call(AGENDA_ID);

    expect(mocks.getStoredCronograma).toHaveBeenCalledWith("house-a", AGENDA_ID);
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("serves the PDF as a private, non-cacheable attachment", async () => {
    mocks.getStoredCronograma.mockResolvedValue({ pdf: Buffer.from("%PDF-1.7 data"), fileName: "Cronograma Ação.pdf" });

    const response = await call(AGENDA_ID);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain("filename*=UTF-8''Cronograma%20A%C3%A7%C3%A3o.pdf");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("%PDF-1.7 data");
  });

  it("answers 500 without details when reading the PDF fails", async () => {
    mocks.getStoredCronograma.mockRejectedValue(new Error("pgp_sym_decrypt failed"));

    const response = await call(AGENDA_ID);

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("pgp_sym_decrypt");
  });
});
