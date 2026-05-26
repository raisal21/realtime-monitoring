export const MIN_PX_PER_TICK = 44;
export const MIN_TICKS = 4;
export const MAX_TICKS = 10;
export const MIN_ENVELOPE_BINS = 60;
export const MAX_ENVELOPE_BINS = 240;
export const PX_PER_ENVELOPE_BIN = 8;

export function getTickCount(canvasPx: number): number {
  return Math.max(
    MIN_TICKS,
    Math.min(MAX_TICKS, Math.floor(canvasPx / MIN_PX_PER_TICK)),
  );
}

export function getEnvelopeBinCount(canvasPx: number): number {
  return Math.max(
    MIN_ENVELOPE_BINS,
    Math.min(MAX_ENVELOPE_BINS, Math.floor(canvasPx / PX_PER_ENVELOPE_BIN)),
  );
}
