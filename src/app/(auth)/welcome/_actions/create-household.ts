"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import { requireSession } from "@/server/auth";
import { createHousehold } from "@/server/households";
import { createHouseholdSchema } from "../_components/create-household";

export type CreateHouseholdResult = { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createHouseholdAction(input: unknown): Promise<CreateHouseholdResult | void> {
  const session = await requireSession();
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    // "already_member" also ends at Início: the user already has a household to work in.
    await createHousehold({ id: session.user.id, firstName: session.user.name }, parsed.data.name);
  } catch {
    console.error("createHouseholdAction failed");
    return { ok: false, message: "Não foi possível criar o household. Tente de novo." };
  }
  redirect(ROUTES.home);
}
