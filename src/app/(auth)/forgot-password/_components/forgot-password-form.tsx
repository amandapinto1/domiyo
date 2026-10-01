"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { emailSchema } from "../../_components/schemas";

const forgotPasswordSchema = z.object({ email: emailSchema });
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const HINT = "Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha. O link vale por 1 hora.";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function handleRequest({ email }: ForgotPasswordValues) {
    setFormError(null);
    try {
      // Same answer whether or not the email exists (no account discovery).
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: ROUTES.resetPassword });
      if (error) {
        setFormError(
          error.status === 429
            ? "Muitas tentativas. Aguarde um pouco e tente de novo."
            : "Não foi possível enviar o link. Tente de novo.",
        );
        return;
      }
      setIsSent(true);
    } catch {
      setFormError("Não foi possível enviar o link. Tente de novo.");
    }
  }

  if (isSent) {
    return (
      <FormAlert
        tone="success"
        message="Pronto. Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam."
      />
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleRequest)} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}
      <FormField
        label="E-mail"
        htmlFor="email"
        errorId="email-error"
        error={errors.email?.message}
        hint={HINT}
        hintId="email-hint"
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy({ hintId: "email-hint", errorId: "email-error", hasError: Boolean(errors.email) })}
          {...register("email")}
        />
      </FormField>
      <Button type="submit" isPending={isSubmitting} pendingLabel="Enviando…">
        Enviar link
      </Button>
    </form>
  );
}
