import { z } from "zod";

// Field rules shared by the access forms. Better Auth enforces the same password limits on the server.
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
export const PASSWORD_HINT = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;

export const emailSchema = z.string().trim().min(1, "Informe seu e-mail.").pipe(z.email("Informe um e-mail válido."));

export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, PASSWORD_HINT)
  .max(MAX_PASSWORD_LENGTH, `Use no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);

export const personNameSchema = (requiredMessage: string) => z.string().trim().min(1, requiredMessage).max(60, "Use no máximo 60 caracteres.");
