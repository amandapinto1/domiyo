import "server-only";

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

  // ponytail: only the console adapter exists; add the SMTP adapter once a provider is approved.
  throw new Error(`EMAIL_TRANSPORT "${transport}" is not available yet.`);
}
