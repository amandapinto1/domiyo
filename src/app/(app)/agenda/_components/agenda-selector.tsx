"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { FOCUS_RING } from "@/components/ui/styles";
import type { AgendaOption } from "../_data-access/get-agenda-view";
import { toggleAgenda } from "./agenda-selection";

type AgendaSelectorProps = {
  agendas: AgendaOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

const OPTION =
  "flex min-h-12 cursor-pointer items-center gap-3 px-4 text-body font-medium text-text hover:bg-lavender-100 has-[:disabled]:cursor-default dark:hover:bg-lavender-800";

/** "Todas as agendas" multiselect; at least one agenda always stays selected (docs/PRD.md). */
export function AgendaSelector({ agendas, selected, onChange }: AgendaSelectorProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const allIds = agendas.map((agenda) => agenda.id);
  const isAll = selected.length === allIds.length;
  const label = isAll
    ? "Todas as agendas"
    : agendas
        .filter((agenda) => selected.includes(agenda.id))
        .map((agenda) => agenda.ownerFirstName)
        .join(", ");

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative w-full md:max-w-75">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-full border-[1.5px] border-lavender-600 px-4 text-body-small font-medium text-text ${FOCUS_RING}`}
      >
        <span className="sr-only">Agendas: </span>
        <span className="truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <fieldset
          id={`${id}-options`}
          className="absolute inset-x-0 top-12 z-20 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg dark:border-lavender-800 dark:bg-lavender-900"
        >
          <legend className="sr-only">Agendas exibidas</legend>
          <label className={`${OPTION} border-b border-line dark:border-lavender-800`}>
            <Checkbox checked={isAll} disabled={isAll} onChange={() => onChange(allIds)} />
            Todas as agendas
          </label>
          {agendas.map((agenda) => {
            const isChecked = selected.includes(agenda.id);
            return (
              <label key={agenda.id} className={OPTION}>
                <Checkbox
                  checked={isChecked}
                  disabled={isChecked && selected.length === 1}
                  onChange={() => onChange(toggleAgenda(selected, allIds, agenda.id))}
                />
                {agenda.ownerFirstName}
              </label>
            );
          })}
        </fieldset>
      ) : null}
    </div>
  );
}

export function AgendaMultiSelect({ agendas, selected, onChange }: AgendaSelectorProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedAgendas = agendas.filter((agenda) => selected.includes(agenda.id));
  const label = selectedAgendas.length === 1
    ? selectedAgendas[0].name
    : `${selectedAgendas.length} agendas selecionadas`;

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-13.5 w-full cursor-pointer items-center justify-between gap-3 rounded-md border-[1.5px] border-lavender-600 bg-white px-4 text-left text-body text-text dark:bg-lavender-950 ${FOCUS_RING}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? (
        <fieldset
          id={`${id}-options`}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-lg dark:border-lavender-800 dark:bg-lavender-900"
        >
          <legend className="sr-only">Agendas do evento</legend>
          {agendas.map((agenda) => {
            const isChecked = selected.includes(agenda.id);
            return (
              <label key={agenda.id} className={OPTION}>
                <Checkbox
                  checked={isChecked}
                  disabled={isChecked && selected.length === 1}
                  onChange={() => onChange(isChecked
                    ? selected.filter((agendaId) => agendaId !== agenda.id)
                    : [...selected, agenda.id])}
                />
                {agenda.name}
              </label>
            );
          })}
        </fieldset>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  checked,
  disabled,
  onChange,
}: {
  id?: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <span className="relative grid size-5 shrink-0 place-items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={`peer size-5 cursor-pointer appearance-none rounded-[4px] border-2 border-lavender-900 checked:bg-lavender-900 disabled:cursor-default dark:border-lime-500 dark:checked:bg-lime-500 ${FOCUS_RING}`}
      />
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute hidden size-3.5 text-white peer-checked:block dark:text-lavender-900"
        strokeWidth={3}
      />
    </span>
  );
}
