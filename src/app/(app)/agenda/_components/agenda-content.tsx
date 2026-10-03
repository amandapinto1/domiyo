"use client";

import { ArrowUpRight, Bell, ChevronLeft, ChevronRight, FileText, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyDay } from "@/components/ui/empty-day";
import { FormAlert } from "@/components/ui/form-alert";
import { FOCUS_RING, OUTLINE_PILL } from "@/components/ui/styles";
import { addDays, centeredDayStripStart, formatItemDate, formatMonth, formatMonthYear, formatWeekRange, weekOf } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { WeekSwipeArea } from "../../_components/week-swipe-area";
import { deleteAgendaItemAction } from "../_actions/delete-agenda-item";
import type { AgendaItemView, AgendaView } from "../_data-access/get-agenda-view";
import { AGENDAS_PARAM } from "./agenda-item-schema";
import { selectionParam } from "./agenda-selection";
import { AgendaSelector } from "./agenda-selector";
import { DatePicker } from "./date-picker";
import { DayList } from "./day-list";
import { ItemDetail } from "./item-detail";
import { ItemForm } from "./item-form";
import { OwnersAvatar } from "./owner-avatar";
import { WeekGrid } from "./week-grid";

const ICON_BUTTON = `grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-lavender-100 text-lavender-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lavender-800 dark:text-white ${FOCUS_RING}`;
const HEADER_BUTTON = `${OUTLINE_PILL} gap-2 bg-white dark:bg-lavender-900`;

type Panel = { kind: "detail" | "edit"; itemId: string } | { kind: "create" } | null;

/** Agenda screen: week navigation, agenda filter, the day (mobile) or week (desktop) and the item panels. */
export function AgendaContent({ view }: { view: AgendaView }) {
  const { householdId, today, selectedDay, week, dayStripStart, agendas, selectedAgendaIds, ownAgendaId, canImportPdf, itemsUnavailable, currentCronograma, items } = view;
  const router = useRouter();
  const panelId = useId();
  const [panel, setPanel] = useState<Panel>(null);
  const [itemToDelete, setItemToDelete] = useState<AgendaItemView | null>(null);
  const [isPickingDate, setIsPickingDate] = useState(false);

  const allIds = agendas.map((agenda) => agenda.id);
  const agendasValue = selectionParam(selectedAgendaIds, allIds);
  const href = (day: string, agendaValue = agendasValue, start = dayStripStart) => {
    const params = new URLSearchParams();
    if (day !== today) params.set("day", day);
    if (agendaValue) params.set(AGENDAS_PARAM, agendaValue);
    if (start !== centeredDayStripStart(day)) params.set("start", start);
    const query = params.toString();
    return query ? `${ROUTES.agenda}?${query}` : ROUTES.agenda;
  };
  const activeItem = panel && panel.kind !== "create" ? (items.find((item) => item.id === panel.itemId) ?? null) : null;
  const isPanelOpen = panel?.kind === "create" || activeItem !== null;
  const dayItems = items.filter((item) => item.date === selectedDay);
  const isWeekEmpty = items.length === 0;
  const openItem = (item: AgendaItemView) => setPanel({ kind: "detail", itemId: item.id });
  const startCreate = () => setPanel({ kind: "create" });
  const previousWeekDay = addDays(selectedDay, -7);
  const nextWeekDay = addDays(selectedDay, 7);

  const weekNavigation = (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={href(previousWeekDay, agendasValue, weekOf(previousWeekDay)[0].date)}
        replace
        scroll={false}
        aria-label="Semana anterior"
        className={ICON_BUTTON}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
      </Link>
      <p className="text-body-small text-text-secondary">{formatWeekRange(week[0].date, week[6].date)}</p>
      <Link
        href={href(nextWeekDay, agendasValue, weekOf(nextWeekDay)[0].date)}
        replace
        scroll={false}
        aria-label="Próxima semana"
        className={ICON_BUTTON}
      >
        <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2} />
      </Link>
    </div>
  );

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title font-medium text-heading">Agenda</h1>
          <p className="mt-1 text-body-small text-text-secondary">{formatMonthYear(selectedDay)}</p>
        </div>
        <div className="flex items-center gap-3">
          {currentCronograma && ownAgendaId ? (
            <a href={`/api/agendas/${encodeURIComponent(ownAgendaId)}/cronograma`} className={`${HEADER_BUTTON} hidden md:flex`}>
              <FileText aria-hidden="true" className="size-5" strokeWidth={1.75} />
              Ver cronograma
            </a>
          ) : null}
          {ownAgendaId && canImportPdf ? (
            <Link href={ROUTES.agendaImport(ownAgendaId)} className={`${HEADER_BUTTON} hidden md:flex`}>
              <Upload aria-hidden="true" className="size-5" strokeWidth={1.75} />
              {currentCronograma ? "Importar novo PDF" : "Importar cronograma"}
            </Link>
          ) : null}
          <button type="button" onClick={startCreate} className={`${HEADER_BUTTON} hidden md:flex`}>
            <Plus aria-hidden="true" className="size-5" strokeWidth={1.75} />
            Novo item
          </button>
          <button
            type="button"
            disabled
            aria-label="Notificações (em breve)"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lavender-900 dark:bg-lavender-900 dark:text-white"
          >
            <Bell aria-hidden="true" className="size-6" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {itemsUnavailable ? (
        <div className="mt-5">
          <FormAlert message="Não foi possível carregar os compromissos protegidos. Confira a configuração de criptografia e tente novamente." />
        </div>
      ) : null}

      <section
        aria-labelledby="agenda-card-title"
        className="mt-6 flex flex-col gap-5 rounded-xl bg-white p-5 md:mt-8 lg:p-6 dark:bg-lavender-900"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="agenda-card-title" className="text-section-heading font-medium text-text">
            {formatMonth(selectedDay)}
          </h2>
          <div className="flex items-center gap-2">
            {ownAgendaId && canImportPdf ? (
              <Link href={ROUTES.agendaImport(ownAgendaId)} aria-label="Importar cronograma" title="Importar cronograma" className={`${ICON_BUTTON} md:hidden`}>
              <Upload aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </Link>
            ) : null}
            <button type="button" onClick={startCreate} aria-label="Novo item" title="Novo item" className={`${ICON_BUTTON} md:hidden`}>
              <Plus aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setIsPickingDate(true)}
              aria-label="Escolher data"
              title="Escolher data"
              className={ICON_BUTTON}
            >
              <ArrowUpRight aria-hidden="true" className="size-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AgendaSelector
            agendas={agendas}
            selected={selectedAgendaIds}
            onChange={(selected) => router.replace(href(selectedDay, selectionParam(selected, allIds)), { scroll: false })}
          />
          {weekNavigation}
        </div>

        {currentCronograma && ownAgendaId ? (
          <a href={`/api/agendas/${encodeURIComponent(ownAgendaId)}/cronograma`} className="inline-flex min-h-11 w-fit items-center gap-2 text-body-small font-medium text-lavender-900 underline underline-offset-4 dark:text-lime-500 lg:hidden">
            <FileText aria-hidden="true" className="size-5" />
            Ver cronograma atual
          </a>
        ) : null}

        <WeekSwipeArea
          key={dayStripStart}
          className="lg:hidden"
          startDate={dayStripStart}
          selectedDay={selectedDay}
          today={today}
          href={(day, start) => href(day, agendasValue, start)}
          onWindowChange={(start) => router.replace(href(selectedDay, agendasValue, start), { scroll: false })}
        />

        <div className="relative hidden lg:block">
          <WeekGrid
            week={week}
            today={today}
            selectedDay={selectedDay}
            items={items}
            dayHref={(day) => href(day)}
            onOpen={openItem}
          />
          {isWeekEmpty ? (
            <div className="absolute inset-x-0 top-40 flex justify-center">
              <EmptyAgenda onCreate={startCreate} />
            </div>
          ) : null}
        </div>
      </section>

      <div className={dayItems.length === 0 ? "flex flex-1 items-center justify-center lg:hidden" : "lg:hidden"}>
        {dayItems.length === 0 ? (
          <EmptyAgenda onCreate={startCreate} />
        ) : (
          <DayList items={dayItems} onOpen={openItem} />
        )}
      </div>

      <Dialog
        isOpen={isPanelOpen}
        onClose={() => setPanel(null)}
        title={panel?.kind === "create" ? "Novo item" : panel?.kind === "edit" ? "Editar item" : (activeItem?.title ?? "")}
        titleId={`${panelId}-title`}
        titleColor={activeItem?.color}
        variant="drawer"
        mobileHeaderAction={panel?.kind === "detail" && activeItem ? <OwnersAvatar owners={activeItem.owners} size="large" /> : undefined}
      >
        {panel?.kind === "detail" && activeItem ? (
          <ItemDetail item={activeItem} onEdit={() => setPanel({ kind: "edit", itemId: activeItem.id })} />
        ) : panel?.kind === "edit" && activeItem ? (
          <ItemForm
            key={activeItem.id}
            householdId={householdId}
            item={activeItem}
            agendas={agendas}
            defaultAgendaId={activeItem.agendaId}
            defaultDate={activeItem.date}
            onDone={() => setPanel(null)}
            onCancel={() => setPanel({ kind: "detail", itemId: activeItem.id })}
            onDelete={() => setItemToDelete(activeItem)}
          />
        ) : panel?.kind === "create" ? (
          <ItemForm
            householdId={householdId}
            item={null}
            agendas={agendas}
            defaultAgendaId={ownAgendaId ?? agendas[0]?.id ?? ""}
            defaultDate={selectedDay}
            onDone={() => setPanel(null)}
            onCancel={() => setPanel(null)}
            onDelete={() => undefined}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title="Excluir este item?"
        description={
          itemToDelete
            ? `“${itemToDelete.title}”, de ${lowerFirst(formatItemDate(itemToDelete.date))}, sai de ${itemToDelete.agendaNames.join(" e ")}. Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          const result = await deleteAgendaItemAction({ householdId, itemId: itemToDelete?.id });
          if (result.ok) setPanel(null);
          return result;
        }}
      />

      <DatePicker
        key={selectedDay}
        isOpen={isPickingDate}
        onClose={() => setIsPickingDate(false)}
        householdId={householdId}
        agendaIds={selectedAgendaIds}
        selectedDay={selectedDay}
        onSelect={(day) => {
          setIsPickingDate(false);
          router.replace(href(day), { scroll: false });
        }}
      />
    </main>
  );
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function EmptyAgenda({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyDay>
      <p className="mt-2 text-body-small text-text-secondary">Importe um cronograma em PDF ou adicione um item manualmente.</p>
      <button type="button" onClick={onCreate} className={`${OUTLINE_PILL} mt-5`}>
        Adicionar item
      </button>
    </EmptyDay>
  );
}
