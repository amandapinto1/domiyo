"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { dangerLinkClassName, linkClassName } from "@/components/ui/link";
import { createInvitationLinkAction } from "../_actions/create-invitation-link";
import { inviteByEmailAction } from "../_actions/invite-by-email";
import { revokeInvitationAction } from "../_actions/revoke-invitation";
import { Dialog } from "@/components/ui/dialog";
import { inviteEmailSchema, type InviteEmailValues } from "./schemas";
import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/ui/styles";

type InviteDialogProps = { householdId: string; isOpen: boolean; onClose: () => void };

/** "Convidar membro": invitation by e-mail or by a single-use link. */
export function InviteDialog({ householdId, isOpen, onClose }: InviteDialogProps) {
  const id = useId();
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Convidar membro" titleId={`${id}-title`} variant="sheet">
      <p className="mt-3 text-body-small text-text-secondary">
        Convide quem mora com você por e-mail ou compartilhe um link de convite.
      </p>
      <EmailInvitationForm householdId={householdId} />
      <InvitationLink householdId={householdId} />
    </Dialog>
  );
}

function EmailInvitationForm({ householdId }: { householdId: string }) {
  const [message, setMessage] = useState<{ text: string; tone: "danger" | "success" } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteEmailValues>({ resolver: zodResolver(inviteEmailSchema), defaultValues: { email: "" } });

  async function handleInvite(values: InviteEmailValues) {
    setMessage(null);
    const result = await inviteByEmailAction({ householdId, ...values });
    if (result.ok) {
      reset();
      setMessage({ text: `Convite enviado para ${values.email}.`, tone: "success" });
      return;
    }
    const emailError = result.fieldErrors?.email?.[0];
    if (emailError) setError("email", { message: emailError });
    else setMessage({ text: result.message, tone: "danger" });
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleInvite)} className="mt-5 flex flex-col gap-4">
      {message ? <FormAlert message={message.text} tone={message.tone} /> : null}
      <FormField label="E-mail de quem vai entrar" htmlFor="invite-email" errorId="invite-email-error" error={errors.email?.message}>
        <Input
          id="invite-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="voce@exemplo.com"
          data-autofocus
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={`${PRIMARY_PILL} w-full`}>
        {isSubmitting ? "Enviando…" : "Enviar convite"}
      </button>
    </form>
  );
}

type GeneratedLink = { invitationId: string; url: string };

function InvitationLink({ householdId }: { householdId: string }) {
  const [link, setLink] = useState<GeneratedLink | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRevoking, startRevoking] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleGenerate() {
    setError(null);
    setStatus("");
    startGenerating(async () => {
      const result = await createInvitationLinkAction({ householdId });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setLink({ invitationId: result.invitationId, url: `${window.location.origin}${result.path}` });
      setStatus("Link de convite gerado.");
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setStatus("Link copiado.");
    } catch {
      inputRef.current?.select();
      setStatus("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  function handleRevoke() {
    if (!link) return;
    setError(null);
    startRevoking(async () => {
      const result = await revokeInvitationAction({ householdId, invitationId: link.invitationId });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setLink(null);
      setStatus("Link revogado. Ele não funciona mais.");
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      {error ? <FormAlert message={error} /> : null}
      {link ? (
        <>
          <label htmlFor="invite-link" className="text-body-small font-medium text-text">
            Ou compartilhe o link de convite
          </label>
          <Input
            ref={inputRef}
            id="invite-link"
            readOnly
            value={link.url}
            onFocus={(event) => event.currentTarget.select()}
            className="text-ellipsis"
            trailing={
              <button type="button" onClick={handleCopy} className={`${linkClassName} px-2`}>
                Copiar
              </button>
            }
          />
          <p className="mt-2 text-center text-body-small text-text-secondary">Vale por 7 dias e pode ser usado por uma pessoa.</p>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isRevoking}
            aria-busy={isRevoking}
            className={`${dangerLinkClassName} mx-auto mt-2`}
          >
            {isRevoking ? "Revogando…" : "Revogar link"}
          </button>
        </>
      ) : (
        <>
          <p className="text-body-small font-medium text-text">Ou compartilhe o link de convite</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            aria-busy={isGenerating}
            className={`${OUTLINE_PILL} w-full`}
          >
            {isGenerating ? "Gerando…" : "Gerar link de convite"}
          </button>
        </>
      )}
      <p role="status" className="text-center text-body-small text-text-secondary empty:hidden">
        {status}
      </p>
    </div>
  );
}
