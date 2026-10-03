"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { dangerLinkClassName } from "@/components/ui/link";
import { FOCUS_RING, OUTLINE_PILL } from "@/components/ui/styles";
import { createAgendaItemAction } from "../_actions/create-agenda-item";
import { updateAgendaItemAction } from "../_actions/update-agenda-item";
import type { AgendaItemView, AgendaOption } from "../_data-access/get-agenda-view";
import { agendaItemSchema, type AgendaItemValues } from "./agenda-item-schema";
import { AgendaMultiSelect, Checkbox } from "./agenda-selector";
import { DatePicker } from "./date-picker";

type ItemFormProps = {
  householdId: string;
  /** Editing this item; without it the form creates a manual item. */
  item: AgendaItemView | null;
  agendas: AgendaOption[];
  defaultAgendaId: string;
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

const FIELDS = ["title", "date", "startTime", "endTime", "type", "location"] as const;
const ALL_DAY = { startTime: "00:00", endTime: "23:59" } as const;

/** "Editar item" / "Novo item": title, date, times, type and location. */
export function ItemForm({ householdId, item, agendas, defaultAgendaId, defaultDate, onDone, onCancel, onDelete }: ItemFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [agendaIds, setAgendaIds] = useState(item?.agendaIds ?? [defaultAgendaId]);
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [isAllDay, setIsAllDay] = useState(
    item?.startTime === ALL_DAY.startTime && item?.endTime === ALL_DAY.endTime,
  );
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    control: formControl,
    formState: { errors, isSubmitting },
  } = useForm<AgendaItemValues>({
    resolver: zodResolver(agendaItemSchema),
    defaultValues: {
      title: item?.title ?? "",
      date: item?.date ?? defaultDate,
      startTime: item?.startTime ?? "",
      endTime: item?.endTime ?? "",
      type: item?.type ?? "",
      location: item?.location ?? "",
    },
  });

  async function handleSave(values: AgendaItemValues) {
    setFormError(null);
    const result = item
      ? await updateAgendaItemAction({ householdId, itemId: item.id, values })
      : await createAgendaItemAction({ householdId, agendaIds, values });
    if (result.ok) {
      onDone();
      return;
    }
    let hasFieldError = false;
    for (const field of FIELDS) {
      const message = result.fieldErrors?.[field]?.[0];
      if (message) {
        setError(field, { message });
        hasFieldError = true;
      }
    }
    if (!hasFieldError) setFormError(result.message);
  }

  const control = (name: (typeof FIELDS)[number]) => ({
    id: `item-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `item-${name}-error` : undefined,
    ...register(name),
  });
  const field = (name: (typeof FIELDS)[number], label: string) => ({
    label,
    htmlFor: `item-${name}`,
    errorId: `item-${name}-error`,
    error: errors[name]?.message,
  });
  const agendaNames = agendas.filter((agenda) => agendaIds.includes(agenda.id)).map((agenda) => agenda.name);
  const date = useWatch({ control: formControl, name: "date" });

  function toggleAllDay() {
    if (!isAllDay) {
      setValue("startTime", ALL_DAY.startTime);
      setValue("endTime", ALL_DAY.endTime);
      clearErrors(["startTime", "endTime"]);
    }
    setIsAllDay(!isAllDay);
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleSave)} className="mt-5 flex flex-col gap-4">
      {formError ? <FormAlert message={formError} /> : null}
      <FormField {...field("title", "Título")}>
        <Input autoComplete="off" data-autofocus {...control("title")} />
      </FormField>
      <FormField {...field("date", "Data")}>
        <input type="hidden" {...register("date")} />
        <button
          type="button"
          id="item-date"
          onClick={() => setIsPickingDate(true)}
          aria-haspopup="dialog"
          aria-describedby={errors.date ? "item-date-value item-date-error" : "item-date-value"}
          className={`flex h-13.5 w-full cursor-pointer items-center justify-between gap-3 rounded-md border-[1.5px] bg-white px-4 text-left text-body text-text dark:bg-lavender-950 ${
            errors.date ? "border-danger" : "border-lavender-600"
          } ${FOCUS_RING}`}
        >
          <span id="item-date-value">{date ? date.split("-").reverse().join("/") : "Escolha a data"}</span>
          <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-lavender-700 dark:text-lavender-300" strokeWidth={1.75} />
        </button>
      </FormField>
      <DatePicker
        key={date}
        isOpen={isPickingDate}
        onClose={() => setIsPickingDate(false)}
        householdId={householdId}
        agendaIds={agendaIds}
        selectedDay={date}
        onSelect={(day) => {
          setValue("date", day, { shouldValidate: true });
          setIsPickingDate(false);
        }}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-body-small font-medium text-text">Horário</legend>
        <div className="grid grid-cols-2 gap-3">
          <FormField {...field("startTime", "Início")}>
            <Input type="time" disabled={isAllDay} {...control("startTime")} />
          </FormField>
          <FormField {...field("endTime", "Fim")}>
            <Input type="time" disabled={isAllDay} {...control("endTime")} />
          </FormField>
        </div>
        <label htmlFor="item-all-day" className="mt-1 flex cursor-pointer items-center gap-3 self-start text-body text-text">
          <Checkbox id="item-all-day" checked={isAllDay} disabled={false} onChange={toggleAllDay} />
          O dia todo
        </label>
      </fieldset>
      <FormField {...field("type", "Tipo")}>
        <Input autoComplete="off" placeholder="Ex.: Aula teórica" {...control("type")} />
      </FormField>
      <FormField {...field("location", "Local")}>
        <Input autoComplete="off" {...control("location")} />
      </FormField>

      {item ? (
        <div>
          <p className="text-body-small text-text-secondary">Agendas</p>
          <p className="mt-0.5 text-body text-text">{agendaNames.join(", ")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span id="item-agendas-label" className="text-body-small font-medium text-text">Agendas</span>
          <AgendaMultiSelect
            agendas={agendas}
            selected={agendaIds}
            onChange={setAgendaIds}
            labelId="item-agendas-label"
          />
        </div>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" isPending={isSubmitting} pendingLabel="Salvando…">
          {item ? "Salvar alterações" : "Adicionar item"}
        </Button>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className={`${OUTLINE_PILL} w-full`}>
          Cancelar
        </button>
        {item ? (
          <button type="button" onClick={onDelete} disabled={isSubmitting} className={`${dangerLinkClassName} mx-auto mt-1`}>
            Excluir item
          </button>
        ) : null}
      </div>
    </form>
  );
}
