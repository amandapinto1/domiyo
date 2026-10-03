"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createHouseholdAction } from "../_actions/create-household";
import { createHouseholdSchema, type CreateHouseholdValues } from "./create-household";

export function CreateHouseholdForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateHouseholdValues>({ resolver: zodResolver(createHouseholdSchema), defaultValues: { name: "" } });

  async function handleCreate(values: CreateHouseholdValues) {
    setFormError(null);
    // On success the action redirects, so a result only comes back on failure.
    const result = await createHouseholdAction(values);
    if (!result) return;
    const nameError = result.fieldErrors?.name?.[0];
    if (nameError) setError("name", { message: nameError });
    else setFormError(result.message);
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}
      <FormField
        label="Nome do household"
        htmlFor="name"
        errorId="name-error"
        error={errors.name?.message}
        hint="Você poderá convidar quem mora com você logo em seguida."
        hintId="name-hint"
      >
        <Input
          id="name"
          autoComplete="off"
          placeholder="Ex.: Casa"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy({ hintId: "name-hint", errorId: "name-error", hasError: Boolean(errors.name) })}
          {...register("name")}
        />
      </FormField>
      <Button type="submit" isPending={isSubmitting} pendingLabel="Criando…">
        Criar household
      </Button>
    </form>
  );
}
