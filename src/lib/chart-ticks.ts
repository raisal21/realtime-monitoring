export const MIN_PX_PER_TICK = 44;
export const MIN_TICKS = 4;
export const MAX_TICKS = 10;

export function getTickCount(canvasPx: number): number {
  return Math.max(
    MIN_TICKS,
    Math.min(MAX_TICKS, Math.floor(canvasPx / MIN_PX_PER_TICK)),
  );
}
