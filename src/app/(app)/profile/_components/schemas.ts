import { z } from "zod";
import { personNameSchema } from "@/app/(auth)/_components/schemas";

export const updateNameSchema = z.object({
  name: personNameSchema("Informe seu nome."),
  surname: personNameSchema("Informe seu sobrenome."),
});

export type UpdateNameValues = z.infer<typeof updateNameSchema>;

export const inviteEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o e-mail de quem vai entrar.")
    .max(254, "Informe um e-mail válido.")
    .pipe(z.email("Informe um e-mail válido.")),
});

export type InviteEmailValues = z.infer<typeof inviteEmailSchema>;

export const householdInputSchema = z.object({ householdId: z.uuid() });
export const invitationInputSchema = householdInputSchema.extend({ invitationId: z.uuid() });
export const memberInputSchema = householdInputSchema.extend({ memberId: z.uuid() });

export type ProfileActionResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
