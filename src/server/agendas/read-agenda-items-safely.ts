export async function readAgendaItemsSafely<T>(read: () => Promise<T[]>): Promise<{
  records: T[];
  unavailable: boolean;
}> {
  try {
    return { records: await read(), unavailable: false };
  } catch {
    return { records: [], unavailable: true };
  }
}