import { requireCurrentMembership } from "@/server/auth";

// Placeholder target after sign-in; the Início screen is a separate task. Without a household it sends to /welcome.
export default async function HomePage() {
  await requireCurrentMembership();

  return (
    <main className="grid min-h-dvh place-items-center bg-lavender-100 px-6 text-center dark:bg-lavender-950">
      <div>
        <h1 className="text-section-heading font-medium text-heading">Você entrou no Domiyo.</h1>
        <p className="mt-2 text-body text-text-secondary">A tela Início ainda está em construção.</p>
      </div>
    </main>
  );
}
