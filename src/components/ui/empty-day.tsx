import { CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";

/** "Agenda / Mobile · Vazio": calendar icon and title; screens add their own hint and action below. */
export function EmptyDay({ children }: { children?: ReactNode }) {
  return (
    <div className="flex max-w-80 flex-col items-center px-6 py-8 text-center lg:rounded-xl lg:bg-white lg:shadow-sm lg:dark:bg-lavender-900">
      <span
        aria-hidden="true"
        className="grid place-items-center text-lavender-700 lg:size-16 lg:rounded-full lg:bg-lavender-100 dark:text-lavender-300 lg:dark:bg-lavender-800"
      >
        <CalendarPlus className="size-7" strokeWidth={1.75} />
      </span>
      <p className="mt-5 text-body font-medium text-text">Nenhum compromisso no dia selecionado</p>
      {children}
    </div>
  );
}
