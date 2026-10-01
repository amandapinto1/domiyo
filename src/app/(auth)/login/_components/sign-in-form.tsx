"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { getSignInErrorMessage, signInSchema, type Notice, type SignInValues } from "./sign-in";

type SignInFormProps = { next?: string; notice: Notice | null };

export function SignInForm({ next, notice }: SignInFormProps) {
  const router = useRouter();
  const [alert, setAlert] = useState<Notice | null>(notice);
  const [isNavigating, startNavigation] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSignIn(values: SignInValues) {
    setAlert(null);
    try {
      const { error } = await authClient.signIn.email(values);
      if (error) {
        setAlert({ tone: "danger", message: getSignInErrorMessage(error) });
        return;
      }
    } catch {
      setAlert({ tone: "danger", message: getSignInErrorMessage({}) });
      return;
    }
    startNavigation(() => router.replace(next ?? ROUTES.home));
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleSignIn)} className="flex flex-col gap-6">
      {alert ? <FormAlert tone={alert.tone} message={alert.message} /> : null}

      <FormField label="E-mail" htmlFor="email" errorId="email-error" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <div className="flex flex-col gap-5">
        <FormField label="Senha" htmlFor="password" errorId="password-error" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </FormField>
        <Link href={ROUTES.forgotPassword} className="self-start">
          Esqueci minha senha
        </Link>
      </div>

      <Button type="submit" isPending={isSubmitting || isNavigating} pendingLabel="Entrando…">
        Entrar
      </Button>
    </form>
  );
}
