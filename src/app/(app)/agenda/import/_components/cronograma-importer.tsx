"use client";

import { AlertCircle, ArrowLeft, Check, FileText, LoaderCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { FOCUS_RING, OUTLINE_PILL, PRIMARY_PILL } from "@/components/ui/styles";
import { formatDuration } from "@/lib/duration";
import { ROUTES } from "@/lib/routes";
import type { ImportDecision, ImportReadState } from "@/server/cronograma";
import type { CronogramaConflict } from "@/server/cronograma/diff";
import { confirmCronogramaImportAction } from "../../_actions/confirm-cronograma-import";
import { failureMessage } from "./failure-message";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const POLL_MS = 5000;

type CronogramaImporterProps = {
  householdId: string;
  agendas: Array<{ id: string; name: string; ownerFirstName: string }>;
  agendaId: string;
  ownAgendaId: string | null;
  importState: ImportReadState;
  currentCronograma: { fileName: string; importedAt: Date } | null;
};

export function CronogramaImporter(props: CronogramaImporterProps) {
  const { householdId, agendas, agendaId, ownAgendaId, importState, currentCronograma } = props;
  const preview = importState.status === "ready" ? importState.preview : null;
  const isReading = importState.status === "reading";
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ added: number; changed: number; removed: number } | null>(null);
  const [decisions, setDecisions] = useState<Record<string, ImportDecision["decision"]>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const headingId = useId();
  const router = useRouter();
  const selectedAgenda = agendas.find((agenda) => agenda.id === agendaId);
  const needsReview = (preview?.conflicts.length ?? 0) > 0;
  const hasAllDecisions = Boolean(preview?.conflicts.every((conflict) => decisions[conflict.itemId]));
  const alertMessage = error ?? (importState.status === "failed" ? failureMessage(importState.code) : null);

  // The read runs on the server and survives closing the screen; while it is open, check for the result.
  useEffect(() => {
    if (!isReading) return;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [isReading, router]);

  async function uploadPdf() {
    if (!file || isUploading || isReading) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    const body = new FormData();
    body.set("agendaId", agendaId);
    body.set("file", file);

    try {
      const response = await fetch("/api/agendas/cronograma", { method: "POST", body });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
          ? data.message
          : "Não foi possível enviar o cronograma.");
        return;
      }
      setDecisions({});
      setFile(null);
      router.refresh();
    } catch {
      setError("Não foi possível enviar o cronograma. Confira o arquivo e tente novamente.");
    } finally {
      setIsUploading(false);
    }
  }

  function confirmImport() {
    if (!preview) return;
    const payload = {
      householdId,
      agendaId,
      pendingId: preview.pendingId,
      decisions: preview.conflicts.map((conflict) => ({
        itemId: conflict.itemId,
        decision: decisions[conflict.itemId] ?? "keep",
      })),
    } satisfies { householdId: string; agendaId: string; pendingId: string; decisions: ImportDecision[] };

    startTransition(async () => {
      const result = await confirmCronogramaImportAction(payload);
      if (result.ok) {
        setSuccess({ added: result.added, changed: result.changed, removed: result.removed });
        setIsConfirming(false);
        router.refresh();
        return;
      }
      if (result.status === "review" && result.conflicts) {
        setDecisions({});
        setIsConfirming(false);
        router.refresh();
        return;
      }
      setError(result.status === "unavailable"
        ? "Esta prévia expirou ou foi substituída. Envie o PDF novamente."
        : "Não foi possível aplicar o cronograma. Tente novamente.");
      setIsConfirming(false);
    });
  }

  function chooseFile(selected: File | undefined) {
    setError(null);
    if (!selected) {
      setFile(null);
    } else if (selected.size > MAX_PDF_BYTES) {
      setFile(null);
      setError("O PDF deve ter até 10 MB.");
    } else if (selected.type !== "application/pdf" && !selected.name.toLocaleLowerCase("pt-BR").endsWith(".pdf")) {
      setFile(null);
      setError("Escolha um arquivo PDF.");
    } else {
      setFile(selected);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 pt-[calc(3rem_+_env(safe-area-inset-top))] pb-28 md:px-10 md:pt-12 md:pb-12 lg:px-16">
      <Link href={ROUTES.agenda} className={`mb-8 inline-flex min-h-10 w-fit items-center gap-2 text-body-small font-medium text-text-secondary ${FOCUS_RING}`}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para agenda
      </Link>
      <header>
        <p className="text-body-small font-medium text-text-secondary">Agenda / Importação</p>
        <h1 id={headingId} className="mt-2 text-page-title font-medium text-heading">Importar cronograma</h1>
        <p className="mt-2 max-w-2xl text-body text-text-secondary">Envie o PDF para organizar as aulas na agenda selecionada. Nada será alterado até a confirmação.</p>
      </header>

      {isReading ? null : (
      <section aria-labelledby={`${headingId}-upload`} className="mt-8 border-t border-line py-7 dark:border-lavender-800">
        <h2 id={`${headingId}-upload`} className="text-section-heading font-medium text-heading">Arquivo e agenda</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-body-small font-medium text-text">
            Agenda
            <select
              value={agendaId}
              onChange={(event) => router.push(ROUTES.agendaImport(event.target.value))}
              className={`h-12 rounded-lg border border-line bg-white px-4 text-body text-text dark:border-lavender-700 dark:bg-lavender-900 ${FOCUS_RING}`}
            >
              {agendas.map((agenda) => <option key={agenda.id} value={agenda.id}>{agenda.ownerFirstName} · {agenda.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-body-small font-medium text-text">
            PDF do cronograma
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
              className={`min-h-12 cursor-pointer rounded-lg border border-line bg-white p-2 text-body-small text-text file:mr-3 file:h-8 file:cursor-pointer file:rounded-full file:border-0 file:bg-lavender-100 file:px-4 file:text-body-small file:font-medium file:text-lavender-900 dark:border-lavender-700 dark:bg-lavender-900 dark:file:bg-lavender-800 dark:file:text-white ${FOCUS_RING}`}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!file || isUploading || isReading || isPending} onClick={uploadPdf} className={PRIMARY_PILL}>
            {isUploading || isPending ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <Upload aria-hidden="true" className="size-5" />}
            {isUploading ? "Enviando…" : "Enviar para leitura"}
          </button>
          {file ? <span className="max-w-full break-all text-body-small text-text-secondary">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span> : null}
          <p className="w-full text-body-small text-text-secondary">PDF de até 10 MB. O arquivo fica privado e protegido.</p>
        </div>
        {currentCronograma ? (
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-text-secondary">
            <FileText aria-hidden="true" className="size-4" />
            Cronograma atual: <span className="font-medium text-text">{currentCronograma.fileName}</span>
            {ownAgendaId === agendaId ? <a href={`/api/agendas/${encodeURIComponent(agendaId)}/cronograma`} className="font-medium text-lavender-900 underline underline-offset-4 dark:text-lime-500">Baixar PDF atual</a> : null}
          </p>
        ) : null}
      </section>
      )}

      {alertMessage ? <div className="mb-5"><FormAlert message={alertMessage} /></div> : null}

      {importState.status === "reading" ? (
        <section aria-labelledby={`${headingId}-reading`} className="mt-8 border-t border-line py-7 dark:border-lavender-800">
          <h2 id={`${headingId}-reading`} className="flex items-center gap-2 text-section-heading font-medium text-heading">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
            Lendo o cronograma
          </h2>
          <p className="mt-2 break-all text-body-small text-text-secondary">{importState.fileName}</p>
          <p className="mt-1 text-body-small text-text-secondary">
            Iniciado há <ElapsedTime key={importState.elapsedMs} elapsedMs={importState.elapsedMs} />
          </p>
          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            A leitura leva cerca de 3 minutos e continua mesmo que você feche esta tela. Volte depois para revisar e confirmar; nada será alterado na agenda antes disso.
          </p>
        </section>
      ) : null}

      {preview ? (
        <section aria-labelledby={`${headingId}-preview`} className="border-t border-line py-7 dark:border-lavender-800">
          <h2 id={`${headingId}-preview`} className="text-section-heading font-medium text-heading">Revise antes de importar</h2>
          <p className="mt-2 text-body text-text-secondary">{preview.title} · {selectedAgenda?.name}</p>
          <p className="mt-1 break-all text-body-small text-text-secondary">{preview.fileName}</p>
          {importState.status === "ready" && importState.readMs !== null ? (
            <p className="mt-1 text-body-small text-text-secondary">Leitura concluída em {formatDuration(importState.readMs)}</p>
          ) : null}
          <dl className="mt-6 grid grid-cols-3 gap-3 md:max-w-xl">
            <Summary label="Novas" value={preview.added} />
            <Summary label="Alteradas" value={preview.changed} />
            <Summary label="Removidas" value={preview.removed} />
          </dl>

          {needsReview ? (
            <div className="mt-7">
              <h3 className="flex items-center gap-2 text-body font-medium text-heading">
                <AlertCircle aria-hidden="true" className="size-5 text-warning-700" />
                Itens com edição manual
              </h3>
              <p className="mt-2 text-body-small text-text-secondary">Escolha o que fazer com cada item. Os demais serão atualizados automaticamente.</p>
              <ul className="mt-4 divide-y divide-line dark:divide-lavender-800">
                {preview.conflicts.map((conflict) => (
                  <ConflictChoice key={conflict.itemId} conflict={conflict} value={decisions[conflict.itemId] ?? ""} onChange={(decision) => setDecisions((current) => ({ ...current, [conflict.itemId]: decision }))} />
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" disabled={isPending || (needsReview && !hasAllDecisions)} onClick={() => setIsConfirming(true)} className={PRIMARY_PILL}>
              <Check aria-hidden="true" className="size-5" />
              Confirmar importação
            </button>
          </div>
        </section>
      ) : null}

      {success ? (
        <section aria-live="polite" className="border-t border-line py-7 dark:border-lavender-800">
          <h2 className="text-section-heading font-medium text-heading">Cronograma importado</h2>
          <p className="mt-2 text-body text-text-secondary">As alterações foram aplicadas à agenda.</p>
          <dl className="mt-5 grid grid-cols-3 gap-3 md:max-w-xl">
            <Summary label="Novas" value={success.added} />
            <Summary label="Alteradas" value={success.changed} />
            <Summary label="Removidas" value={success.removed} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {ownAgendaId === agendaId ? <a href={`/api/agendas/${encodeURIComponent(agendaId)}/cronograma`} className={OUTLINE_PILL}>Baixar PDF</a> : null}
            <Link href={ROUTES.agenda} className={PRIMARY_PILL}>Ir para agenda</Link>
          </div>
        </section>
      ) : null}

      <Dialog
        isOpen={isConfirming}
        onClose={() => { if (!isPending) setIsConfirming(false); }}
        title="Aplicar este cronograma?"
        titleId={`${headingId}-confirm`}
        variant="modal"
      >
        <p className="mt-3 text-body text-text-secondary">A agenda será atualizada com as alterações exibidas. O PDF atual só será substituído depois da confirmação.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isPending} onClick={() => setIsConfirming(false)} className={OUTLINE_PILL}>Revisar</button>
          <button type="button" disabled={isPending || (needsReview && !hasAllDecisions)} onClick={confirmImport} className={PRIMARY_PILL}>
            {isPending ? "Aplicando…" : "Aplicar cronograma"}
          </button>
        </div>
      </Dialog>
    </main>
  );
}

/** Ticks every second from a server-computed start, so a wrong device clock does not skew it; remounted on each refresh. */
function ElapsedTime({ elapsedMs }: { elapsedMs: number }) {
  const [extraMs, setExtraMs] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setExtraMs((current) => current + 1000), 1000);
    return () => clearInterval(timer);
  }, []);
  return <>{formatDuration(elapsedMs + extraMs)}</>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l-2 border-lavender-600 pl-3 dark:border-lime-500">
      <dt className="text-body-small text-text-secondary">{label}</dt>
      <dd className="mt-1 text-numeric-emphasis font-medium text-heading">{value}</dd>
    </div>
  );
}

function ConflictChoice({
  conflict,
  value,
  onChange,
}: {
  conflict: CronogramaConflict;
  value: string;
  onChange: (decision: ImportDecision["decision"]) => void;
}) {
  const groupId = useId();
  const options: Array<{ value: ImportDecision["decision"]; label: string }> = conflict.kind === "changed"
    ? [{ value: "keep", label: "Manter minha edição" }, { value: "apply", label: "Usar nova informação" }]
    : [{ value: "keep", label: "Manter aula" }, { value: "remove", label: "Remover aula" }];
  return (
    <li className="py-5">
      <fieldset>
        <legend className="text-body font-medium text-text">{conflict.title}</legend>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          {options.map((option) => (
            <label key={option.value} htmlFor={`${groupId}-${option.value}`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-body-small text-text">
              <input
                id={`${groupId}-${option.value}`}
                type="radio"
                name={groupId}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={`size-4 accent-lavender-900 dark:accent-lime-500 ${FOCUS_RING}`}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </li>
  );
}