import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { getMembership } from "@/server/households";
import { getStoredCronograma } from "@/server/cronograma";

const agendaIdSchema = z.uuid();

export async function GET(_request: Request, context: { params: Promise<{ agendaId: string }> }) {
  const session = await requireSession();
  const currentMembership = await getMembership(session.user.id);
  if (!currentMembership) return new Response("Não encontrado.", { status: 404, headers: { "Cache-Control": "no-store" } });
  const membership = await requireHouseholdMember(currentMembership.householdId);
  const { agendaId } = await context.params;
  if (!agendaIdSchema.safeParse(agendaId).success) return new Response("Não encontrado.", { status: 404 });

  try {
    const record = await getStoredCronograma(membership.householdId, agendaId);
    if (!record) return new Response("Não encontrado.", { status: 404, headers: { "Cache-Control": "no-store" } });
    const encodedName = encodeURIComponent(record.fileName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(record.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cronograma.pdf"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(record.pdf.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("cronograma.download.failed");
    return new Response("Não foi possível baixar o cronograma.", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}