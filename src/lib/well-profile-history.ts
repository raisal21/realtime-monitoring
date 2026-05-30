import type { HistoryExtentMessage } from "@/domain/message.types";
import {
  capRangeToLatest,
  historyExtentTimeRange,
  type NumericRange,
} from "@/lib/history-extent";
import { buildCustomTileRangeRequest } from "@/lib/tile-sync";
import {
  tileDepthPoints,
  type TileDepthPoint,
  type TileResponse,
} from "@/services/tiles-client";

export const WELL_PROFILE_HISTORY_STREAMS = ["drill"] as const;
export const WELL_PROFILE_REQUEST_ID_MIN = 1_000_000_000;
export const WELL_PROFILE_REQUEST_ID_MAX = 1_999_999_999;

export function wellProfileHistoryRangeFromExtent(
  extent: HistoryExtentMessage | null | undefined,
): NumericRange | null {
  return capRangeToLatest(historyExtentTimeRange(extent));
}

export function buildWellProfileHistoryRequest(
  extent: HistoryExtentMessage | null | undefined,
  subscriptionId: number,
) {
  const range = wellProfileHistoryRangeFromExtent(extent);
  if (!range) return null;
  return buildCustomTileRangeRequest(
    range,
    subscriptionId,
    WELL_PROFILE_HISTORY_STREAMS,
  );
}

export function wellProfilePointsFromTiles(
  tiles: TileResponse | null | undefined,
): TileDepthPoint[] {
  return tiles ? tileDepthPoints(tiles) : [];
}

export function wellProfileTimeRangeFromPoints(
  points: readonly TileDepthPoint[],
): NumericRange | null {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    if (!Number.isFinite(point.timestamp)) continue;
    min = Math.min(min, point.timestamp);
    max = Math.max(max, point.timestamp);
  }
  return min <= max ? { min, max } : null;
}

export function profileDepthAxisRange(
  points: readonly TileDepthPoint[],
  fallbackMax: number,
): NumericRange {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    if (!Number.isFinite(point.depth)) continue;
    min = Math.min(min, point.depth);
    max = Math.max(max, point.depth);
  }
  if (min > max) return { min: 0, max: fallbackMax };

  const span = Math.max(max - min, 1);
  const pad = Math.max(span * 0.05, 10);
  return {
    min: Math.max(0, min - pad),
    max: max + pad,
  };
}

export function normalizeProfileTimeRange(
  range: NumericRange | null | undefined,
): NumericRange | null {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return null;
  }
  if (range.max > range.min) return range;
  const pad = 30 * 60_000;
  return { min: range.min - pad, max: range.max + pad };
}
