import { z } from "zod";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const agendaItemSchema = z
  .object({
    title: z.string().trim().min(1, "Dê um título ao item.").max(120, "Use no máximo 120 caracteres."),
    date: z.iso.date("Informe a data."),
    startTime: z.string().regex(TIME, "Informe o início."),
    endTime: z.string().regex(TIME, "Informe o fim."),
    type: z.string().trim().max(80, "Use no máximo 80 caracteres."),
    location: z.string().trim().max(120, "Use no máximo 120 caracteres."),
  })
  .refine((values) => values.endTime > values.startTime, {
    path: ["endTime"],
    message: "O fim precisa ser depois do início.",
  });

export type AgendaItemValues = z.infer<typeof agendaItemSchema>;

export type AgendaActionResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Agendas in the URL: `?agendas=id1,id2`; absent means every agenda. */
export const AGENDAS_PARAM = "agendas";
