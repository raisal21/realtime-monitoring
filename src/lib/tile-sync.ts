import { PRESET_TO_MINUTES } from "@/data/dashboard-static";
import { isTilePreset, pickResolution } from "@/lib/tile-resolution";
import type {
  ActiveTileSubscription,
  RangePreset,
  TileStreamName,
} from "@/store/slices/chart-slice";
import type { TileRange, TileRes } from "@/services/tiles-client";

export const MS_PER_MIN = 60_000;
export const TILE_STREAMS: readonly TileStreamName[] = ["drill", "geo"];

type TileSubscribeMessage = {
  messageType: "TILE_SUBSCRIBE";
  payload: {
    subscriptionId: number;
    spanMinutes: number;
    res: TileRes;
    streams: TileStreamName[];
  };
};

type TileRangeRequestMessage = {
  messageType: "TILE_RANGE_REQUEST";
  payload: {
    subscriptionId: number;
    fromUnixMs: number;
    toUnixMs: number;
    res: TileRes;
    streams: TileStreamName[];
  };
};

export type TileSyncRequest = {
  subscription: ActiveTileSubscription;
  range: TileRange;
  message: TileSubscribeMessage | TileRangeRequestMessage;
};

export function buildPresetTileSubscribe(
  preset: RangePreset | null,
  subscriptionId: number,
  nowMs: number,
  streams: readonly TileStreamName[] = TILE_STREAMS,
): TileSyncRequest | null {
  if (!isTilePreset(preset)) return null;
  const spanMinutes = PRESET_TO_MINUTES[preset!];
  const res = pickResolution(spanMinutes);
  if (!res) return null;
  const range = {
    min: nowMs - spanMinutes * MS_PER_MIN,
    max: nowMs,
  };
  const streamList = [...streams];
  const subscription = { subscriptionId, spanMinutes, res, streams: streamList };
  return {
    subscription,
    range,
    message: {
      messageType: "TILE_SUBSCRIBE",
      payload: {
        subscriptionId,
        spanMinutes,
        res,
        streams: streamList,
      },
    },
  };
}

export function buildCustomTileRangeRequest(
  range: TileRange,
  subscriptionId: number,
  streams: readonly TileStreamName[] = TILE_STREAMS,
): TileSyncRequest | null {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.max <= range.min) {
    return null;
  }
  const spanMinutes = Math.ceil((range.max - range.min) / MS_PER_MIN);
  const res = pickResolution(spanMinutes);
  if (!res) return null;
  const streamList = [...streams];
  const subscription = { subscriptionId, spanMinutes, res, streams: streamList };
  return {
    subscription,
    range,
    message: {
      messageType: "TILE_RANGE_REQUEST",
      payload: {
        subscriptionId,
        fromUnixMs: Math.trunc(range.min),
        toUnixMs: Math.trunc(range.max),
        res,
        streams: streamList,
      },
    },
  };
}
