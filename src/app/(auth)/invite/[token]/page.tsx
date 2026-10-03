import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ROUTES } from "@/lib/routes";
import { getSession } from "@/server/auth";
import { getMembership, getOpenInvitation } from "@/server/households";
import { AuthCard, AuthFooter, AuthIntro } from "../../_components/auth-screen";
import { acceptInvitationAction, declineInvitationAction } from "./_actions/respond-to-invitation";
import { AcceptButton, DeclineButton } from "./_components/invitation-buttons";
import { invitationTokenSchema } from "./_components/invitation-token";

export const metadata: Metadata = { title: "Convite · Domiyo" };

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: process.env.APP_DEFAULT_TIME_ZONE ?? "America/Fortaleza",
  }).format(date);

// The link is the secret: anyone holding it sees who invited them; expired/used/revoked links reveal nothing.
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsedToken = invitationTokenSchema.safeParse(token);
  const invitation = parsedToken.success ? await getOpenInvitation(parsedToken.data) : null;

  if (!parsedToken.success || !invitation) {
    return (
      <>
        <AuthIntro title="Convite indisponível">Este convite expirou, já foi usado ou foi cancelado.</AuthIntro>
        <AuthCard title="Peça um novo convite" description="Fale com quem convidou você para receber um novo link de convite.">
          <ButtonLink href={ROUTES.signIn}>Ir para o login</ButtonLink>
        </AuthCard>
        <AuthFooter>
          Ainda não tem conta? <Link href={ROUTES.signUp}>Criar conta</Link>
        </AuthFooter>
      </>
    );
  }

  const session = await getSession();
  const isAlreadyMember = session ? Boolean(await getMembership(session.user.id)) : false;
  const invitedBy = `${invitation.inviterName} convidou você para o household “${invitation.householdName}”.`;
  const decline = (
    <form action={declineInvitationAction.bind(null, parsedToken.data)} className="inline">
      <DeclineButton />
    </form>
  );

  if (isAlreadyMember) {
    return (
      <>
        <AuthIntro title="Você já participa de um household">
          {invitedBy} Por enquanto, cada pessoa participa de apenas um household.
        </AuthIntro>
        <AuthCard
          title="Quer entrar nesse household?"
          description="Primeiro saia do seu household atual em Perfil › Household e depois abra o link do convite de novo. Ao sair, a sua agenda e todos os itens dela são apagados."
        >
          <ButtonLink href={ROUTES.home}>Voltar para o início</ButtonLink>
        </AuthCard>
        <AuthFooter>Não quer entrar nesse household? {decline}</AuthFooter>
      </>
    );
  }

  return (
    <>
      <AuthIntro title="Você recebeu um convite">{invitedBy}</AuthIntro>
      <AuthCard
        title="Entrar no household"
        description={`Convite válido até ${formatDay(invitation.expiresAt)}. Ao aceitar, sua agenda é criada automaticamente.`}
      >
        <form action={acceptInvitationAction.bind(null, parsedToken.data)}>
          <AcceptButton />
        </form>
      </AuthCard>
      <AuthFooter>Não conhece esse household? {decline}</AuthFooter>
    </>
  );
}
