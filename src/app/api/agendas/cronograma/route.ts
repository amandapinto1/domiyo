import { after } from "next/server";
import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { getMembership } from "@/server/households";
import { completePendingCronogramaImport, consumeCronogramaUpload, failPendingCronogramaImport, isAgendaInHousehold, isCronogramaReadInProgress, savePendingCronogramaImport } from "@/server/cronograma";
import { CronogramaAiError, parseCronogramaPdf } from "@/server/cronograma/claude";
import { toCronogramaEvents } from "@/server/cronograma/schema";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_PDF_BYTES + 128 * 1024;
const uploadInputSchema = z.object({ agendaId: z.uuid() });
const error = (status: number, message: string) => Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

function hasTrustedOrigin(request: Request): boolean {
  const expected = new URL(process.env.APP_PUBLIC_URL || request.url).origin;
  return request.headers.get("origin") === expected;
}

function safeFileName(name: string): string {
  const baseName = name.replace(/^.*[\\/]/, "").replace(/[\r\n\u0000-\u001f"]/g, "_").trim().slice(0, 120);
  return baseName.toLocaleLowerCase("pt-BR").endsWith(".pdf") ? baseName : "cronograma.pdf";
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return error(403, "Origem não permitida.");
  const session = await requireSession();
  const currentMembership = await getMembership(session.user.id);
  if (!currentMembership) return error(404, "Essa agenda não está disponível.");
  const membership = await requireHouseholdMember(currentMembership.householdId);
  if (membership.canImportPdf !== true) return error(404, "Essa agenda não está disponível.");

  const declaredLength = Number(request.headers.get("content-length"));
  if (!Number.isInteger(declaredLength) || declaredLength <= 0) return error(411, "Envie o arquivo novamente.");
  if (declaredLength > MAX_MULTIPART_BYTES) return error(413, "O PDF deve ter até 10 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Não foi possível ler o arquivo enviado.");
  }
  const input = uploadInputSchema.safeParse({ agendaId: form.get("agendaId") });
  const file = form.get("file");
  if (!input.success || !(file instanceof File)) return error(400, "Escolha uma agenda e um arquivo PDF.");
  if (!(await isAgendaInHousehold(membership.householdId, input.data.agendaId))) return error(404, "Essa agenda não está disponível.");
  if (await isCronogramaReadInProgress(membership.householdId, input.data.agendaId)) {
    return error(409, "Já existe uma leitura em andamento para esta agenda. Aguarde ela terminar.");
  }
  if (file.size <= 0 || file.size > MAX_PDF_BYTES) return error(413, "O PDF deve ter até 10 MB.");

  const pdf = Buffer.from(await file.arrayBuffer());
  if (pdf.length < 5 || pdf.toString("ascii", 0, 5) !== "%PDF-") return error(415, "O arquivo escolhido não é um PDF válido.");
  if (!(await consumeCronogramaUpload(membership.userId))) {
    return Response.json({ message: "Você atingiu o limite de importações. Tente novamente em alguns minutos." }, {
      status: 429,
      headers: { "Cache-Control": "no-store", "Retry-After": "600" },
    });
  }

  let pendingId: string | null;
  try {
    pendingId = await savePendingCronogramaImport({
      householdId: membership.householdId,
      agendaId: input.data.agendaId,
      userId: membership.userId,
      pdf,
      fileName: safeFileName(file.name),
    });
  } catch {
    console.error("cronograma.upload.failed reason=save");
    return error(500, "Não foi possível guardar o arquivo. Tente novamente.");
  }
  if (!pendingId) return error(404, "Essa agenda não está disponível.");

  const { householdId } = membership;
  const { agendaId } = input.data;
  const readingId = pendingId;
  // Runs after the response, so closing the screen does not stop the read; the result is stored for the import screen.
  after(async () => {
    try {
      const model = await parseCronogramaPdf(pdf);
      const events = toCronogramaEvents(model);
      if (events.length === 0) return await failPendingCronogramaImport({ agendaId, pendingId: readingId, code: "no_events" });
      if (events.length > 1500) return await failPendingCronogramaImport({ agendaId, pendingId: readingId, code: "too_many_events" });
      await completePendingCronogramaImport({ householdId, agendaId, pendingId: readingId, model });
    } catch (failure: unknown) {
      const code = failure instanceof CronogramaAiError ? failure.code : "internal";
      const safe = (value: string | number | undefined) => String(value ?? "-").replace(/[^a-zA-Z0-9_:.,*-]/g, "").slice(0, 300);
      if (failure instanceof CronogramaAiError) {
        console.error(`cronograma.upload.failed reason=${code} status=${safe(failure.upstreamStatus)} requestId=${safe(failure.requestId)} upstreamType=${safe(failure.upstreamType)} detail=${safe(failure.detail)}`);
      } else {
        console.error("cronograma.upload.failed reason=internal");
      }
      await failPendingCronogramaImport({ agendaId, pendingId: readingId, code }).catch(() => undefined);
    }
  });

  return Response.json({ status: "reading" }, { status: 202, headers: { "Cache-Control": "no-store" } });
}