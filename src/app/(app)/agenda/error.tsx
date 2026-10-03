"use client";

import { TriangleAlert } from "lucide-react";
import { PRIMARY_PILL } from "@/components/ui/styles";

export default function AgendaError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col px-6 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16">
      <h1 className="text-page-title font-medium text-heading">Agenda</h1>
      <div role="alert" className="mx-auto mt-24 flex max-w-80 flex-col items-center text-center">
        <TriangleAlert aria-hidden="true" className="size-7 text-lavender-700 dark:text-lavender-300" strokeWidth={1.75} />
        <p className="mt-5 text-body font-medium text-text">Não foi possível carregar a agenda</p>
        <p className="mt-2 text-body-small text-text-secondary">Verifique sua conexão e tente novamente.</p>
        <button type="button" onClick={retry} className={`${PRIMARY_PILL} mt-5`}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
