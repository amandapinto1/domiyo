import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Link } from "@/components/ui/link";
import { ROUTES, safeNextPath, withNext, type SearchParams } from "@/lib/routes";
import { getSession } from "@/server/auth";
import { AuthCard, AuthFooter, AuthIntro } from "../_components/auth-screen";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = { title: "Criar conta · Domiyo" };

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNextPath((await searchParams).next);
  const isInvitationFlow = next?.startsWith("/invite/") ?? false;
  if (await getSession()) redirect(next ?? ROUTES.home);

  return (
    <>
      <AuthIntro title="Crie sua conta">Organize a casa junto com quem mora com você.</AuthIntro>
      {isInvitationFlow ? (
        <p className="mt-5 text-center text-body-small text-text dark:text-text-secondary">
          Já tem um login? <Link href={withNext(ROUTES.signIn, next)}>Entre</Link>
        </p>
      ) : null}
      <AuthCard title="Criar conta">
        <SignUpForm next={next} />
      </AuthCard>
      {!isInvitationFlow ? (
        <AuthFooter>
          Já tem uma conta? <Link href={withNext(ROUTES.signIn, next)}>Entrar</Link>
        </AuthFooter>
      ) : null}
    </>
  );
}
