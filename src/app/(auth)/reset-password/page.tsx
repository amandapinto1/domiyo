import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ROUTES, type SearchParams } from "@/lib/routes";
import { AuthCard, AuthFooter, AuthIntro } from "../_components/auth-screen";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = { title: "Criar nova senha · Domiyo" };

// The emailed link goes through Better Auth, which redirects here with ?token= (valid) or ?error= (expired/used).
export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const { token, error } = await searchParams;
  const backToSignIn = (
    <AuthFooter>
      Voltar para o <Link href={ROUTES.signIn}>login</Link>
    </AuthFooter>
  );

  if (error || typeof token !== "string" || !token) {
    return (
      <>
        <AuthIntro title="Link expirado">Este link para criar uma nova senha expirou ou já foi usado.</AuthIntro>
        <AuthCard
          title="Peça um novo link"
          description="Por segurança, cada link vale por pouco tempo e só pode ser usado uma vez."
        >
          <ButtonLink href={ROUTES.forgotPassword}>Enviar novo link</ButtonLink>
        </AuthCard>
        {backToSignIn}
      </>
    );
  }

  return (
    <>
      <AuthIntro title="Crie uma nova senha">Escolha uma senha que você não usou antes aqui.</AuthIntro>
      <AuthCard title="Nova senha">
        <ResetPasswordForm token={token} />
      </AuthCard>
      {backToSignIn}
    </>
  );
}
