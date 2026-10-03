import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, fetchMock, sendMailMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(),
  fetchMock: vi.fn(),
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
  vi.unstubAllGlobals();
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
      configuredVariables: [
        "EMAIL_TRANSPORT",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_SECURE",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAIL_FROM_ADDRESS",
        "EMAIL_FROM_NAME",
      ],
    });
  });

  it("logs only allowlisted SMTP command names", () => {
    const error = Object.assign(new Error("Timed out"), { code: "ETIMEDOUT", command: "CONN" });

    expect(emailFailureDetails(error)).toMatchObject({
      errorCode: "ETIMEDOUT",
      smtpCommand: "CONN",
    });
  });

  it("reports missing configuration names without logging the raw message", () => {
    expect(emailFailureDetails(new Error("Missing SMTP configuration: SMTP_PASSWORD."))).toEqual({
      errorName: "Error",
      configuredVariables: [
        "EMAIL_TRANSPORT",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_SECURE",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAIL_FROM_ADDRESS",
        "EMAIL_FROM_NAME",
      ],
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

describe("Brevo API email transport", () => {
  const email = {
    to: "invitee@example.test",
    subject: "Confirme seu e-mail no Domiyo",
    html: "<p>Confirme seu e-mail.</p>",
    text: "Confirme seu e-mail.",
  };

  beforeEach(() => {
    vi.stubEnv("EMAIL_TRANSPORT", "brevo-api");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends transactional content over HTTPS with the API key header", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    await sendEmail(email);

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(request.method).toBe("POST");
    expect(request.headers).toEqual({
      "api-key": "test-api-key",
      "content-type": "application/json",
    });
    expect(JSON.parse(request.body as string)).toEqual({
      sender: { email: "nao-responda@notify.domiyo.app", name: "Domiyo" },
      to: [{ email: email.to }],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
    });
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it("reports only the HTTP status when Brevo rejects a request", async () => {
    fetchMock.mockResolvedValue(new Response("private response body", { status: 401 }));

    await expect(sendEmail(email)).rejects.toMatchObject({
      name: "BrevoApiError",
      httpStatusCode: 401,
    });
  });

  it("fails clearly when the Brevo API key is missing", async () => {
    vi.stubEnv("BREVO_API_KEY", "");

    await expect(sendEmail(email)).rejects.toThrow("Missing Brevo API configuration: BREVO_API_KEY.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});