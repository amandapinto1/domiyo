"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { describedBy, FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { newPasswordSchema, PASSWORD_HINT } from "../../_components/schemas";

const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirmation: z.string().min(1, "Repita a nova senha.") })
  .refine((values) => values.password === values.confirmation, {
    path: ["confirmation"],
    message: "As senhas não são iguais.",
  });
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmation: "" },
  });

  async function handleReset({ password }: ResetPasswordValues) {
    setFormError(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error?.code === "INVALID_TOKEN") {
        startNavigation(() => router.replace(`${ROUTES.resetPassword}?error=INVALID_TOKEN`));
        return;
      }
      if (error) {
        setFormError(
          error.status === 429
            ? "Muitas tentativas. Aguarde um pouco e tente de novo."
            : "Não foi possível salvar a nova senha. Tente de novo.",
        );
        return;
      }
    } catch {
      setFormError("Não foi possível salvar a nova senha. Tente de novo.");
      return;
    }
    startNavigation(() => router.replace(`${ROUTES.signIn}?reset=success`));
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleReset)} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}
      <FormField label="Nova senha" htmlFor="password" errorId="password-error" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={describedBy({
            hintId: "password-hint",
            errorId: "password-error",
            hasError: Boolean(errors.password),
          })}
          {...register("password")}
        />
      </FormField>
      <FormField
        label="Confirmar nova senha"
        htmlFor="confirmation"
        errorId="confirmation-error"
        error={errors.confirmation?.message}
        hint={PASSWORD_HINT}
        hintId="password-hint"
      >
        <PasswordInput
          id="confirmation"
          autoComplete="new-password"
          aria-invalid={errors.confirmation ? true : undefined}
          aria-describedby={describedBy({ errorId: "confirmation-error", hasError: Boolean(errors.confirmation) })}
          {...register("confirmation")}
        />
      </FormField>
      <Button type="submit" isPending={isSubmitting || isNavigating} pendingLabel="Salvando…">
        Salvar nova senha
      </Button>
    </form>
  );
}
