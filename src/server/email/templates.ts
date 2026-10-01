import "server-only";
import type { Email } from "./index";

// Layout and copy: docs/design/email/README.md. Email-safe HTML: tables and inline styles only.
const FONT = "Roboto, Arial, sans-serif";
const FOOTER_AUTOMATIC = "E-mail automático do Domiyo — não responda.";
const timeZone = process.env.APP_DEFAULT_TIME_ZONE ?? "America/Fortaleza";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

type Layout = {
  title: string;
  paragraphs: string[];
  button: { label: string; url: string };
  showFallbackLink: boolean;
  note?: string;
  footer: string[];
};

function render(to: string, subject: string, layout: Layout): Email {
  const appUrl = process.env.APP_PUBLIC_URL ?? "";
  const { title, paragraphs, button, showFallbackLink, note, footer } = layout;
  const paragraph = (text: string, style: string) =>
    `<p style="margin:0 0 16px;font:400 16px/24px ${FONT};${style}">${escapeHtml(text)}</p>`;
  const small = (text: string) => `<p style="margin:0 0 8px;font:400 14px/20px ${FONT};color:#77758D;">${text}</p>`;

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#E4E3F2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E4E3F2;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="padding:0 0 24px;"><img src="${escapeHtml(appUrl)}/email/domiyo-logo.png" alt="Domiyo" width="140" style="display:block;border:0;"></td></tr>
<tr><td style="background:#FFFFFF;border-radius:28px;padding:40px;">
<h1 style="margin:0 0 16px;font:500 32px/40px ${FONT};color:#382344;">${escapeHtml(title)}</h1>
${paragraphs.map((text) => paragraph(text, "color:#2B2944;")).join("")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:#382344;border-radius:999px;">
<a href="${escapeHtml(button.url)}" style="display:inline-block;padding:12px 28px;font:500 16px/24px ${FONT};color:#FFFFFF;text-decoration:none;">${escapeHtml(button.label)}</a>
</td></tr></table>
${showFallbackLink ? small(`Se o botão não funcionar, copie e cole este link no navegador:<br><a href="${escapeHtml(button.url)}" style="color:#332DB4;word-break:break-all;">${escapeHtml(button.url)}</a>`) : ""}
${note ? small(escapeHtml(note)) : ""}
</td></tr>
<tr><td style="padding:24px 8px 0;">${footer.map((line) => small(escapeHtml(line))).join("")}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    title,
    "",
    ...paragraphs,
    "",
    `${button.label}: ${button.url}`,
    ...(note ? ["", note] : []),
    "",
    ...footer,
  ].join("\n");

  return { to, subject, html, text };
}

export function verifyEmailMessage(to: string, url: string): Email {
  return render(to, "Confirme seu e-mail no Domiyo", {
    title: "Confirme seu e-mail",
    paragraphs: ["Falta só um passo para começar a usar o Domiyo: confirme que este e-mail é seu."],
    button: { label: "Confirmar e-mail", url },
    showFallbackLink: true,
    note: "O link vale por 1 hora e só pode ser usado uma vez. Se você não criou uma conta, ignore este e-mail.",
    footer: [FOOTER_AUTOMATIC],
  });
}

export function resetPasswordMessage(to: string, url: string): Email {
  return render(to, "Redefina sua senha do Domiyo", {
    title: "Crie uma nova senha",
    paragraphs: ["Recebemos um pedido para redefinir a senha da sua conta no Domiyo."],
    button: { label: "Criar nova senha", url },
    showFallbackLink: true,
    note: "O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu, ignore este e-mail: sua senha continua a mesma.",
    footer: [FOOTER_AUTOMATIC],
  });
}

export function householdInvitationMessage(
  to: string,
  invitation: { inviterFirstName: string; inviterFullName: string; householdName: string; url: string; expiresAt: Date },
): Email {
  const { inviterFirstName, inviterFullName, householdName, url, expiresAt } = invitation;
  const expiryDate = new Intl.DateTimeFormat("pt-BR", { timeZone, day: "numeric", month: "long" }).format(expiresAt);
  const subject = `${inviterFirstName} convidou você para o Domiyo`;

  return render(to, subject, {
    title: subject,
    paragraphs: [
      `Você recebeu um convite para entrar no household “${householdName}” e organizar a agenda da casa em conjunto.`,
    ],
    button: { label: "Aceitar convite", url },
    showFallbackLink: true,
    note: `Este convite vale até ${expiryDate} e só pode ser usado uma vez.`,
    footer: [
      `Você recebeu este e-mail porque ${inviterFullName} informou este endereço ao convidar você. Se não conhece essa pessoa, ignore esta mensagem.`,
      FOOTER_AUTOMATIC,
    ],
  });
}

export function passwordChangedMessage(to: string, changedAt: Date, forgotPasswordUrl: string): Email {
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone, dateStyle: "long" }).format(changedAt);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone, timeStyle: "short" }).format(changedAt);

  return render(to, "Sua senha do Domiyo foi alterada", {
    title: "Sua senha foi alterada",
    paragraphs: [
      "A senha da sua conta no Domiyo foi alterada.",
      `${date}, às ${time} (horário de Fortaleza)`,
      "Se foi você, está tudo certo e não precisa fazer nada.",
      "Se não foi você, redefina sua senha agora e avise quem mora com você.",
    ],
    button: { label: "Redefinir senha", url: forgotPasswordUrl },
    showFallbackLink: false,
    footer: ["Enviamos este aviso por segurança sempre que a senha muda.", FOOTER_AUTOMATIC],
  });
}
