"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { updateNameAction } from "../_actions/update-name";
import { updateNameSchema, type UpdateNameValues } from "./schemas";
import { CARD, ICON_BUTTON, OUTLINE_PILL, PRIMARY_PILL } from "./styles";

type AccountCardProps = { firstName: string; surname: string; email: string };

/** Name and e-mail; the name is edited in place. The e-mail cannot change yet. */
export function AccountCard({ firstName, surname, email }: AccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReturnFocus = useRef(false);
  const fullName = `${firstName} ${surname}`.trim();

  useEffect(() => {
    if (isEditing || !shouldReturnFocus.current) return;
    shouldReturnFocus.current = false;
    editButtonRef.current?.focus();
  }, [isEditing]);

  function handleDone() {
    shouldReturnFocus.current = true;
    setIsEditing(false);
  }

  return (
    <section aria-label="Sua conta" className={CARD}>
      {isEditing ? (
        <EditNameForm firstName={firstName} surname={surname} onDone={handleDone} />
      ) : (
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="min-w-0">
            <p className="text-body-small text-text-secondary">Nome</p>
            <p className="mt-1 text-body break-words text-text">{fullName}</p>
          </div>
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Editar nome"
            title="Editar nome"
            className={ICON_BUTTON}
          >
            <Pencil aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
          </button>
        </div>
      )}
      <div className="border-t border-line pt-4 dark:border-lavender-800">
        <p className="text-body-small text-text-secondary">E-mail</p>
        <p className="mt-1 text-body break-all text-text">{email}</p>
      </div>
    </section>
  );
}

function EditNameForm({ firstName, surname, onDone }: { firstName: string; surname: string; onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateNameValues>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: firstName, surname },
  });

  async function handleSave(values: UpdateNameValues) {
    setFormError(null);
    const result = await updateNameAction(values);
    if (result.ok) {
      onDone();
      return;
    }
    const fieldErrors = result.fieldErrors ?? {};
    for (const field of ["name", "surname"] as const) {
      const message = fieldErrors[field]?.[0];
      if (message) setError(field, { message });
    }
    if (!fieldErrors.name && !fieldErrors.surname) setFormError(result.message);
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4 pb-5">
      {formError ? <FormAlert message={formError} /> : null}
      <FormField label="Nome" htmlFor="profile-name" errorId="profile-name-error" error={errors.name?.message}>
        <Input
          id="profile-name"
          autoComplete="given-name"
          autoFocus
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          {...register("name")}
        />
      </FormField>
      <FormField label="Sobrenome" htmlFor="profile-surname" errorId="profile-surname-error" error={errors.surname?.message}>
        <Input
          id="profile-surname"
          autoComplete="family-name"
          aria-invalid={errors.surname ? true : undefined}
          aria-describedby={errors.surname ? "profile-surname-error" : undefined}
          {...register("surname")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onDone} disabled={isSubmitting} className={OUTLINE_PILL}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={PRIMARY_PILL}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
