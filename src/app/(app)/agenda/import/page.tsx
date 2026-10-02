import type { Metadata } from "next";
import type { SearchParams } from "@/lib/routes";
import { CronogramaImporter } from "./_components/cronograma-importer";
import { getCronogramaImportView } from "./_data-access/get-import-view";

export const metadata: Metadata = { title: "Importar cronograma · Domiyo" };

export default async function CronogramaImportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = await getCronogramaImportView(params.agendaId);
  return <CronogramaImporter key={view.agendaId} {...view} />;
}