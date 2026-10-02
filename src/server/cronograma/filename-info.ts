export async function getCronogramaInfoWithFilenameFallback(
  readWithFilename: () => Promise<{ fileName: string | null; importedAt: Date } | null>,
  readImportedAt: () => Promise<Date | null>,
  onFilenameError: () => void,
): Promise<{ fileName: string; importedAt: Date } | null> {
  try {
    const record = await readWithFilename();
    return record ? { fileName: record.fileName ?? "cronograma.pdf", importedAt: record.importedAt } : null;
  } catch {
    const importedAt = await readImportedAt();
    if (!importedAt) return null;
    onFilenameError();
    return { fileName: "cronograma.pdf", importedAt };
  }
}