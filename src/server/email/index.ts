import "server-only";
import nodemailer from "nodemailer";

export type Email = { to: string; subject: string; html: string; text: string };

/** Sends a transactional email through the transport chosen by EMAIL_TRANSPORT (docs/ARCHITECTURE.md > Email delivery). */
export async function sendEmail(email: Email): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? "console";

  if (transport === "console") {
    // Production logs never carry the address or the body, which holds single-use links.
    if (process.env.NODE_ENV === "production") {
      console.info("email.console", { subject: email.subject });
      return;
    }
    console.info(`\n[email] Para: ${email.to}\nAssunto: ${email.subject}\n\n${email.text}\n`);
    return;
  }

  if (transport === "smtp") {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;
    const missing = [
      ["SMTP_HOST", smtpHost],
      ["SMTP_USER", smtpUser],
      ["SMTP_PASSWORD", smtpPassword],
      ["EMAIL_FROM_ADDRESS", fromAddress],
    ].filter(([, value]) => !value).map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(`Missing SMTP configuration: ${missing.join(", ")}.`);
    }

    const port = Number(process.env.SMTP_PORT ?? "587");
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
    }

    const secureSetting = process.env.SMTP_SECURE ?? "false";
    if (secureSetting !== "true" && secureSetting !== "false") {
      throw new Error('SMTP_SECURE must be either "true" or "false".');
    }

    const smtp = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: secureSetting === "true",
      auth: { user: smtpUser, pass: smtpPassword },
    });

    await smtp.sendMail({
      from: { name: process.env.EMAIL_FROM_NAME ?? "Domiyo", address: fromAddress },
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return;
  }

  throw new Error(`EMAIL_TRANSPORT "${transport}" is not available yet.`);
}
