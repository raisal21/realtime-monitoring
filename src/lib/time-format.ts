export function formatLocalHHMM(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return "--:--";

  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
