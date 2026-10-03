// Skeleton while the week loads: the card's place, then neutral item blocks (Figma "Agenda · Carregando").
export default function AgendaLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando a agenda"
      className="flex min-h-dvh flex-col px-6 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16"
    >
      <h1 className="text-page-title font-medium text-heading">Agenda</h1>
      <div className="mt-6 h-72 rounded-xl bg-white motion-safe:animate-pulse md:mt-8 dark:bg-lavender-900" />
      <div className="mt-6 flex flex-col gap-5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-16 rounded-md bg-white motion-safe:animate-pulse dark:bg-lavender-900" />
        ))}
      </div>
    </main>
  );
}
