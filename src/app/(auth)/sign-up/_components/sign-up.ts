import { z } from "zod";
import { emailSchema, newPasswordSchema, personNameSchema } from "../../_components/schemas";

export const signUpSchema = z.object({
  name: personNameSchema("Informe seu nome."),
  surname: personNameSchema("Informe seu sobrenome."),
  email: emailSchema,
  password: newPasswordSchema,
});

export type SignUpValues = z.infer<typeof signUpSchema>;

/** Sign-up answers the same way for new and existing emails, so errors here never reveal an account. */
export function getSignUpErrorMessage(error: { status?: number }): string {
  if (error.status === 429) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Não foi possível criar a conta. Tente de novo.";
}
