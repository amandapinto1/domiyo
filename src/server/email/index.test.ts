import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

import { emailFailureDetails, sendEmail } from "./index";

beforeEach(() => {
  vi.stubEnv("EMAIL_TRANSPORT", "smtp");
  vi.stubEnv("SMTP_HOST", "smtp-relay.brevo.com");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_SECURE", "false");
  vi.stubEnv("SMTP_USER", "test-user");
  vi.stubEnv("SMTP_PASSWORD", "test-password");
  vi.stubEnv("EMAIL_FROM_ADDRESS", "nao-responda@notify.domiyo.app");
  vi.stubEnv("EMAIL_FROM_NAME", "Domiyo");
  sendMailMock.mockResolvedValue({ messageId: "test-message-id" });
  createTransportMock.mockReturnValue({ sendMail: sendMailMock });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("email failure details", () => {
  it("keeps SMTP codes but omits raw error content", () => {
    const error = Object.assign(new Error("Rejected invitee@example.test with secret details"), {
      code: "EAUTH",
      responseCode: 535,
      response: "Sensitive SMTP response",
    });

    expect(emailFailureDetails(error)).toEqual({
      errorName: "Error",
      errorCode: "EAUTH",
      smtpResponseCode: 535,
    });
  });

  it("reports missing configuration names without logging the raw message", () => {
    expect(emailFailureDetails(new Error("Missing SMTP configuration: SMTP_PASSWORD."))).toEqual({
      errorName: "Error",
      missingConfiguration: ["SMTP_PASSWORD"],
    });
  });
});

describe("SMTP email transport", () => {
  it("sends through the configured SMTP server with the configured sender", async () => {
    await sendEmail({
      to: "invitee@example.test",
      subject: "Convite para o Domiyo",
      html: "<p>Você recebeu um convite.</p>",
      text: "Você recebeu um convite.",
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: "test-user", pass: "test-password" },
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: { name: "Domiyo", address: "nao-responda@notify.domiyo.app" },
      to: "invitee@example.test",
      subject: "Convite para o Domiyo",
      html: "<p>Você recebeu um convite.</p>",
      text: "Você recebeu um convite.",
    });
  });

  it("fails clearly when SMTP credentials are missing", async () => {
    vi.stubEnv("SMTP_PASSWORD", "");

    await expect(sendEmail({
      to: "invitee@example.test",
      subject: "Convite para o Domiyo",
      html: "<p>Você recebeu um convite.</p>",
      text: "Você recebeu um convite.",
    })).rejects.toThrow("Missing SMTP configuration: SMTP_PASSWORD.");
    expect(createTransportMock).not.toHaveBeenCalled();
  });
});