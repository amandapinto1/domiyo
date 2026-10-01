import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao household.").max(80, "Use no máximo 80 caracteres."),
});

export type CreateHouseholdValues = z.infer<typeof createHouseholdSchema>;
