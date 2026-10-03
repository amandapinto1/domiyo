"use client";

import { Mail, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { dangerLinkClassName, linkClassName } from "@/components/ui/link";
import { deleteDeclinedInvitationAction } from "../_actions/delete-declined-invitation";
import { leaveHouseholdAction } from "../_actions/leave-household";
import { removeMemberAction } from "../_actions/remove-member";
import { revokeInvitationAction } from "../_actions/revoke-invitation";
import type { ProfileView } from "../_data-access/get-profile-view";
import { Avatar } from "./avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { InvitationItemView, InvitationTone } from "./invitation-summary";
import { InviteDialog } from "./invite-dialog";
import { CARD, FOCUS_RING } from "@/components/ui/styles";

type Household = ProfileView["household"];
type MemberView = Household["members"][number];

const STATUS_TONES: Record<InvitationTone, string> = {
  info: "bg-info-100 text-info-600 dark:bg-lavender-800 dark:text-info-300",
  warning: "bg-warning-100 text-warning-600 dark:bg-lavender-800 dark:text-warning-300",
  neutral: "bg-lavender-100 text-lavender-800 dark:bg-lavender-800 dark:text-lavender-300",
};

function describeMemberCount(count: number): string {
  return count === 1 ? "1 membro" : `${count} membros`;
}

/** "Meu household": members, sent invitations, inviting, removing and leaving. */
export function HouseholdCard({ household }: { household: Household }) {
  const { id: householdId, name, members, invitations, isLastMember } = household;
  const [isInviting, setIsInviting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberView | null>(null);

  const leaveDescription = isLastMember
    ? `Você é o último membro. Ao sair, o household “${name}” e todos os dados dele são apagados para sempre e não podem ser recuperados.`
    : `Você perde o acesso ao household “${name}” e a sua agenda é apagada, com todos os itens. Para voltar, você vai precisar de um novo convite.`;

  return (
    <section aria-labelledby="household-title" className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="household-title" className="text-section-heading font-medium text-text">
            {name}
          </h2>
          <p className="mt-1 text-body-small text-text-secondary">{describeMemberCount(members.length)}</p>
        </div>
        <button type="button" onClick={() => setIsLeaving(true)} className={`${dangerLinkClassName} mt-1.5 shrink-0`}>
          Sair do household
        </button>
      </div>

      <ul aria-label="Membros" className="mt-4 flex flex-col gap-4">
        {members.map((member) => (
          <li key={member.memberId} className="flex items-center gap-3">
            <Avatar firstName={member.firstName} size="small" isYou={member.isYou} photoUrl={member.photoUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium break-words text-text">{member.firstName}</p>
              <p className="text-body-small text-text-secondary">{member.roleLabel}</p>
            </div>
            {member.isYou ? null : (
              <button
                type="button"
                onClick={() => setMemberToRemove(member)}
                aria-label={`Remover ${member.firstName}`}
                className={dangerLinkClassName}
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>

      {invitations.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-body font-medium text-text">Convites enviados</h3>
          <ul className="mt-3 flex flex-col gap-4">
            {invitations.map((invitation) => (
              <InvitationRow key={invitation.id} householdId={householdId} invitation={invitation} />
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsInviting(true)}
        className={`mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-lavender-600 text-body-small font-medium text-text hover:bg-lavender-100 dark:hover:bg-lavender-800 ${FOCUS_RING}`}
      >
        <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
        Adicionar membro
      </button>

      <InviteDialog householdId={householdId} isOpen={isInviting} onClose={() => setIsInviting(false)} />
      <ConfirmDialog
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        title={`Remover ${memberToRemove?.firstName ?? ""} do household?`}
        description={`${memberToRemove?.firstName ?? ""} perde o acesso ao household e a Agenda de ${memberToRemove?.firstName ?? ""} é apagada, com todos os itens. Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        pendingLabel="Removendo…"
        onConfirm={() => removeMemberAction({ householdId, memberId: memberToRemove?.memberId })}
      />
      <ConfirmDialog
        isOpen={isLeaving}
        onClose={() => setIsLeaving(false)}
        title="Sair do household?"
        description={leaveDescription}
        confirmLabel="Sair"
        pendingLabel="Saindo…"
        onConfirm={() => leaveHouseholdAction({ householdId })}
      />
    </section>
  );
}

function InvitationRow({ householdId, invitation }: { householdId: string; invitation: InvitationItemView }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isCancel = invitation.action === "cancel";

  function handleAction() {
    setError(null);
    startTransition(async () => {
      const input = { householdId, invitationId: invitation.id };
      const result = isCancel ? await revokeInvitationAction(input) : await deleteDeclinedInvitationAction(input);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-100 text-lavender-900 dark:bg-lavender-800 dark:text-white"
      >
        <Mail className="size-4.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-body break-all text-text">{invitation.title}</p>
          <button
            type="button"
            onClick={handleAction}
            disabled={isPending}
            aria-busy={isPending}
            aria-label={`${isCancel ? "Cancelar convite de" : "Remover convite de"} ${invitation.title}`}
            className={`${isCancel ? dangerLinkClassName : linkClassName} shrink-0`}
          >
            {isCancel ? "Cancelar" : "Remover"}
          </button>
        </div>
        <span
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-body-small font-medium ${STATUS_TONES[invitation.status.tone]}`}
        >
          {invitation.status.label}
        </span>
        <p className="mt-1 text-body-small text-text-secondary">{invitation.detail}</p>
        {error ? (
          <div className="mt-2">
            <FormAlert message={error} />
          </div>
        ) : null}
      </div>
    </li>
  );
}
