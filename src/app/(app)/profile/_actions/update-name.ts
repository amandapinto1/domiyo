"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, requireSession } from "@/server/auth";
import { updateNameSchema, type ProfileActionResult } from "../_components/schemas";

export async function updateNameAction(input: unknown): Promise<ProfileActionResult> {
  await requireSession();
  const parsed = updateNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    // Better Auth updates the signed-in user only; the id never comes from the client.
    await auth.api.updateUser({ headers: await headers(), body: parsed.data });
  } catch {
    console.error("updateNameAction failed");
    return { ok: false, message: "Não foi possível salvar o nome. Tente de novo." };
  }
  refresh();
  return { ok: true };
}
