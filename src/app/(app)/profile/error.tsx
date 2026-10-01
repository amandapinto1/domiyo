"use client";

import { Button } from "@/components/ui/button";

export default function ProfileError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-110 flex-col justify-center px-6 pb-28 md:pb-12">
      <h1 className="text-section-heading font-medium text-heading">Não foi possível carregar o Perfil.</h1>
      <p className="mt-2 text-body text-text-secondary">Verifique sua conexão e tente de novo.</p>
      <div className="mt-8">
        <Button onClick={retry}>Tentar de novo</Button>
      </div>
    </main>
  );
}
