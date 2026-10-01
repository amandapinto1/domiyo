import type { Metadata } from "next";
import { Link } from "@/components/ui/link";
import { ROUTES } from "@/lib/routes";
import { AuthCard, AuthFooter, AuthIntro } from "../_components/auth-screen";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = { title: "Esqueceu a senha? · Domiyo" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthIntro title="Esqueceu a senha?">Sem problema. A gente ajuda você a criar uma nova.</AuthIntro>
      <AuthCard title="Redefinir senha">
        <ForgotPasswordForm />
      </AuthCard>
      <AuthFooter>
        Lembrou a senha? <Link href={ROUTES.signIn}>Entrar</Link>
      </AuthFooter>
    </>
  );
}
