import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Link } from "@/components/ui/link";
import { ROUTES, safeNextPath, withNext, type SearchParams } from "@/lib/routes";
import { getSession } from "@/server/auth";
import { AuthCard, AuthFooter, AuthIntro } from "../_components/auth-screen";
import { IntroSplash } from "./_components/intro-splash";
import { getSignInNotice } from "./_components/sign-in";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = { title: "Entrar · Domiyo" };

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getSession()) redirect(next ?? ROUTES.home);

  return (
    <>
      <IntroSplash />
      <AuthIntro title="Que bom ter você de volta!">Entre para ver a agenda do household.</AuthIntro>
      <AuthCard title="Entrar">
        <SignInForm next={next} notice={getSignInNotice(params)} />
      </AuthCard>
      <AuthFooter>
        Ainda não tem conta? <Link href={withNext(ROUTES.signUp, next)}>Criar conta</Link>
      </AuthFooter>
    </>
  );
}
