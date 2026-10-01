import type { SentInvitation } from "@/server/households";

export type InvitationTone = "info" | "warning" | "neutral";

export type InvitationItemView = {
  id: string;
  title: string;
  status: { label: string; tone: InvitationTone };
  detail: string;
  /** Pending invitations can be cancelled; declined ones can be removed from the list. */
  action: "cancel" | "remove";
};

/** What the "Convites enviados" list shows for one invitation; `formatDate` gives "28 set". */
export function summarizeInvitation(invitation: SentInvitation, formatDate: (date: Date) => string): InvitationItemView {
  const { id, email, createdAt, expiresAt, respondedAt, inviteeSignedUpAt } = invitation;
  const title = email ?? "Link de convite";

  if (invitation.status === "declined") {
    return {
      id,
      title,
      status: { label: "Recusado", tone: "neutral" },
      detail: `Recusou em ${formatDate(respondedAt ?? createdAt)}`,
      action: "remove",
    };
  }
  if (inviteeSignedUpAt) {
    return {
      id,
      title,
      status: { label: "Pendente de confirmação de e-mail", tone: "warning" },
      detail: `Criou a conta em ${formatDate(inviteeSignedUpAt)}, falta confirmar o e-mail`,
      action: "cancel",
    };
  }
  return {
    id,
    title,
    status: { label: "Pendente", tone: "info" },
    detail: `${email ? "Enviado" : "Criado"} em ${formatDate(createdAt)} · vale até ${formatDate(expiresAt)}`,
    action: "cancel",
  };
}
