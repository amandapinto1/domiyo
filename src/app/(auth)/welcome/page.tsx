import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { requireSession } from "@/server/auth";
import { getMembership } from "@/server/households";
import { AuthCard, AuthFooter, AuthIntro } from "../_components/auth-screen";
import { CreateHouseholdForm } from "./_components/create-household-form";
import { InviteHint } from "./_components/invite-hint";

export const metadata: Metadata = { title: "Primeiro acesso · Domiyo" };

// First access: a signed-in user without a household creates one (docs/PRD.md).
export default async function WelcomePage() {
  const session = await requireSession();
  if (await getMembership(session.user.id)) redirect(ROUTES.home);

  return (
    <>
      <AuthIntro title={`Boas-vindas, ${session.user.name}!`}>
        Para começar, crie o seu household ou entre em um que já existe.
      </AuthIntro>
      <AuthCard title="Criar household">
        <CreateHouseholdForm />
      </AuthCard>
      <AuthFooter>
        Recebeu um convite? <InviteHint />
      </AuthFooter>
    </>
  );
}
