import { z } from "zod";
import { emailSchema } from "../../_components/schemas";

export const signInSchema = z.object({
  email: emailSchema,
  // No length rule here: sign-in only checks that a password was typed.
  password: z.string().min(1, "Informe sua senha."),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type Notice = { tone: "danger" | "success"; message: string };

/** Message for the sign-in screen when it is reached from an email link or after a password reset. */
export function getSignInNotice(params: { error?: unknown; reset?: unknown }): Notice | null {
  if (params.reset === "success") return { tone: "success", message: "Senha alterada. Entre com a nova senha." };
  // Better Auth appends ?error= when an email confirmation link is invalid or expired.
  if (typeof params.error === "string") {
    return {
      tone: "danger",
      message: "O link de confirmação expirou ou já foi usado. Entre com seu e-mail e senha para receber um novo.",
    };
  }
  return null;
}

/** Maps a Better Auth sign-in error to a safe pt-BR message that never reveals whether an account exists. */
export function getSignInErrorMessage(error: { status?: number; code?: string }): string {
  if (error.code === "EMAIL_NOT_VERIFIED") {
    return "Confirme seu e-mail antes de entrar. Enviamos um novo link para você.";
  }
  if (error.status === 401) return "E-mail ou senha incorretos.";
  if (error.status === 429) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Não foi possível entrar. Tente de novo.";
}
