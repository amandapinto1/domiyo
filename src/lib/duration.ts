const plural = (value: number, singular: string, many: string) => `${value} ${value === 1 ? singular : many}`;

/** "2 minutos e 10 segundos", "1 minuto", "45 segundos" (pt-BR); rounds down to whole seconds. */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    ...(minutes > 0 ? [plural(minutes, "minuto", "minutos")] : []),
    ...(seconds > 0 || minutes === 0 ? [plural(seconds, "segundo", "segundos")] : []),
  ];
  return parts.join(" e ");
}
