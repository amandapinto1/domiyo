import { describe, expect, it } from "vitest";
import { summarizeInvitation } from "./invitation-summary";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const base = {
  id: "7a1f9c62-4f3e-4e4b-9b8e-1d2c3b4a5f60",
  email: "bia@exemplo.com",
  status: "pending" as const,
  createdAt: new Date("2026-09-28T12:00:00Z"),
  expiresAt: new Date("2026-10-05T12:00:00Z"),
  respondedAt: null,
  inviteeSignedUpAt: null,
};

describe("summarizeInvitation", () => {
  it("shows a pending email invitation with its validity and a cancel action", () => {
    expect(summarizeInvitation(base, formatDate)).toEqual({
      id: base.id,
      title: "bia@exemplo.com",
      status: { label: "Pendente", tone: "info" },
      detail: "Enviado em 2026-09-28 · vale até 2026-10-05",
      action: "cancel",
    });
  });

  it("names link invitations and says when they were created", () => {
    const summary = summarizeInvitation({ ...base, email: null }, formatDate);
    expect(summary.title).toBe("Link de convite");
    expect(summary.detail).toBe("Criado em 2026-09-28 · vale até 2026-10-05");
  });

  it("flags an invitee who signed up but has not confirmed the e-mail", () => {
    const summary = summarizeInvitation({ ...base, inviteeSignedUpAt: new Date("2026-09-29T12:00:00Z") }, formatDate);
    expect(summary.status).toEqual({ label: "Pendente de confirmação de e-mail", tone: "warning" });
    expect(summary.detail).toBe("Criou a conta em 2026-09-29, falta confirmar o e-mail");
    expect(summary.action).toBe("cancel");
  });

  it("shows a declined invitation without a reason and lets it be removed", () => {
    const summary = summarizeInvitation(
      { ...base, status: "declined", respondedAt: new Date("2026-09-29T12:00:00Z") },
      formatDate,
    );
    expect(summary.status).toEqual({ label: "Recusado", tone: "neutral" });
    expect(summary.detail).toBe("Recusou em 2026-09-29");
    expect(summary.action).toBe("remove");
  });
});
