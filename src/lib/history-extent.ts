import type { HistoryExtentMessage } from "@/domain/message.types";

export type NumericRange = { min: number; max: number };
export type DateBounds = { from: Date; to: Date };

export const CUSTOM_HISTORY_MAX_DAYS = 30;
export const CUSTOM_HISTORY_MAX_MS = CUSTOM_HISTORY_MAX_DAYS * 24 * 60 * 60_000;

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function localDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function historyExtentTimeRange(
  extent: HistoryExtentMessage | null | undefined,
): NumericRange | null {
  const min = extent?.shared.minTimeMs;
  const max = extent?.shared.maxTimeMs;
  if (!finite(min) || !finite(max) || min > max) return null;
  return { min, max };
}

export function historyExtentDateBounds(range: NumericRange): DateBounds {
  return {
    from: localDay(new Date(range.min)),
    to: localDay(new Date(range.max)),
  };
}

export function capRangeToLatest(
  range: NumericRange | null | undefined,
  maxSpanMs = CUSTOM_HISTORY_MAX_MS,
): NumericRange | null {
  if (!range) return null;
  const min = Math.max(range.min, range.max - maxSpanMs);
  return min <= range.max ? { min, max: range.max } : null;
}

export function clampRangeToHistoryExtent(
  min: number,
  max: number,
  range: NumericRange | null | undefined,
): NumericRange | null {
  if (!range) return { min: Math.min(min, max), max: Math.max(min, max) };
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const nextMin = Math.max(lo, range.min);
  const nextMax = Math.min(hi, range.max);
  if (nextMin >= nextMax) return null;
  return { min: nextMin, max: nextMax };
}
