export const MIN_PX_PER_TICK = 56;
export const MIN_TICKS = 8;
export const MAX_TICKS = 14;
export const MIN_ENVELOPE_BINS = 30;
export const MAX_ENVELOPE_BINS = 120;
export const PX_PER_ENVELOPE_BIN = 24;

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
