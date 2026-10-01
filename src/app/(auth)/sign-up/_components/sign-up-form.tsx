"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { ROUTES, withNext } from "@/lib/routes";
import { PASSWORD_HINT } from "../../_components/schemas";
import { getSignUpErrorMessage, signUpSchema, type SignUpValues } from "./sign-up";

export function SignUpForm({ next }: { next?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", surname: "", email: "", password: "" },
  });

  async function handleSignUp(values: SignUpValues) {
    setFormError(null);
    try {
      // The confirmation link signs the person in and returns to the sign-in route, which forwards to `next`.
      const { error } = await authClient.signUp.email({ ...values, callbackURL: withNext(ROUTES.signIn, next) });
      if (error) {
        setFormError(getSignUpErrorMessage(error));
        return;
      }
      setSentTo(values.email);
    } catch {
      setFormError(getSignUpErrorMessage({}));
    }
  }

  if (sentTo) {
    return (
      <FormAlert
        tone="success"
        message={`Enviamos um link de confirmação para ${sentTo}. Abra o e-mail para ativar sua conta; o link vale por 1 hora.`}
      />
    );
  }

  const field = (name: keyof SignUpValues) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": describedBy({
      hintId: name === "password" ? "password-hint" : undefined,
      errorId: `${name}-error`,
      hasError: Boolean(errors[name]),
    }),
    ...register(name),
  });

  return (
    <form noValidate onSubmit={handleSubmit(handleSignUp)} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}

      <FormField label="Nome" htmlFor="name" errorId="name-error" error={errors.name?.message}>
        <Input autoComplete="given-name" placeholder="Seu nome" {...field("name")} />
      </FormField>
      <FormField label="Sobrenome" htmlFor="surname" errorId="surname-error" error={errors.surname?.message}>
        <Input autoComplete="family-name" placeholder="Seu sobrenome" {...field("surname")} />
      </FormField>
      <FormField label="E-mail" htmlFor="email" errorId="email-error" error={errors.email?.message}>
        <Input type="email" inputMode="email" autoComplete="email" placeholder="voce@exemplo.com" {...field("email")} />
      </FormField>
      <FormField
        label="Senha"
        htmlFor="password"
        errorId="password-error"
        error={errors.password?.message}
        hint={errors.password ? undefined : PASSWORD_HINT}
        hintId="password-hint"
      >
        <PasswordInput autoComplete="new-password" {...field("password")} />
      </FormField>

      <Button type="submit" isPending={isSubmitting} pendingLabel="Criando conta…">
        Criar conta
      </Button>
    </form>
  );
}
