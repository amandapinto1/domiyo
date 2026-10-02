import { formatItemDate } from "@/lib/dates";
import { OUTLINE_PILL } from "@/components/ui/styles";
import type { AgendaItemView } from "../_data-access/get-agenda-view";

type ItemDetailProps = { item: AgendaItemView; onEdit: () => void };

/** "Detalhe do item": every known field of the item, then "Editar item". */
export function ItemDetail({ item, onEdit }: ItemDetailProps) {
  const fields: [string, string | null][] = [
    ["Pertence a", item.agendaName],
    ["Origem", item.isImported ? "Importado do PDF" : "Criado manualmente"],
    ["Data e horário", `${formatItemDate(item.date)} · ${item.startTime} – ${item.endTime}`],
    ["Local", item.location],
    [item.isImported ? "Aula" : "Tipo", item.type],
    ["Metodologia", item.tag],
    ["Professor(a)", item.teacher],
    ["Conteúdo", item.content],
  ];

  return (
    <>
      <dl className="mt-5 flex flex-col gap-4">
        {fields.map(([label, value]) =>
          value ? (
            <div key={label}>
              <dt className="text-body-small text-text-secondary">{label}</dt>
              <dd className="mt-0.5 text-body break-words text-text">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      <button type="button" data-autofocus onClick={onEdit} className={`${OUTLINE_PILL} mt-6 w-full`}>
        Editar item
      </button>
    </>
  );
}
