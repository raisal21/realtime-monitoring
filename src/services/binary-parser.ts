import { z } from "zod";
import { log } from "@/utils/logger";
import { DrillSchema, GeoSchema } from "@/domain/message.schema";
import type { DrillUpdate, GeoUpdate } from "@/domain/message.types";
import {
  PROTOCOL_VERSION,
  TileFrameType,
  TileResCode,
  TileStreamCode,
} from "@/domain/constants";
import type { TileResponse, TileRes } from "@/services/tiles-client";

const TILE_HEADER_BYTES = 40;

const TILE_TRACES = {
  drill: ["depth", "rpm", "wob", "torque", "hkld", "spp", "flow"],
  geo: ["depth", "gamma", "rop", "h2s", "inc", "azi"],
} as const;

type TileStreamName = keyof typeof TILE_TRACES;

const RES_BY_CODE = new Map<number, TileRes>(
  Object.entries(TileResCode).map(([res, code]) => [code, res as TileRes]),
);

export type ParsedTileFrame = {
  frameType: TileFrameType;
  kind: "snapshot" | "update";
  subscriptionId: number;
  stream: TileStreamName;
  res: TileRes;
  traceMask: number;
  fromUnixMs: number;
  toUnixMs: number;
  replaceFromUnixMs: number;
  tiles: TileResponse;
};

export const readDrillBuff = (buffer: ArrayBuffer): DrillUpdate | null => {
  const view = new DataView(buffer);

  if (buffer.byteLength < 44) {
    log.error("Insufficient buffer length for Drill packet!");
    return null;
  }

  const protocol = view.getUint8(1);

  if (protocol !== PROTOCOL_VERSION) {
    log.warn(`[PARSER] Unsupported protocol version: ${protocol}`);
  }

  const rawData: DrillUpdate = {
    timestamp: Number(view.getBigUint64(8)),
    depth: view.getFloat32(16),
    sequence: view.getUint32(4),
    rpm: view.getFloat32(20),
    wob: view.getFloat32(24),
    torque: view.getFloat32(28),
    hkld: view.getFloat32(32),
    spp: view.getFloat32(36),
    flow: view.getFloat32(40),
  };

  // Validate with .partial() since the incoming data is only a subset of RigState
  const validation = DrillSchema.safeParse(rawData);

  if (!validation.success) {
    log.error("Zod Validation Error:", z.prettifyError(validation.error));
    return null;
  }

  return validation.data;
};

export const readGeoBuff = (buffer: ArrayBuffer): GeoUpdate | null => {
  const view = new DataView(buffer);

  if (buffer.byteLength < 40) {
    log.error("Insufficient buffer length for Geo packet!");
    return null;
  }

  const streamId = view.getUint8(0);
  if (streamId !== 102) {
    log.warn(`[PARSER] Unexpected streamId: ${streamId}`);
  }

  const protocol = view.getUint8(1);
  if (protocol !== 1) {
    log.warn(`[PARSER] Unsupported protocol version: ${protocol}`);
  }

  const rawData: GeoUpdate = {
    sequence: view.getUint32(4),
    timestamp: Number(view.getBigUint64(8)),
    depth: view.getFloat32(16),
    gamma: view.getFloat32(20),
    rop: view.getFloat32(24),
    h2s: view.getFloat32(28),
    inc: view.getFloat32(32),
    azi: view.getFloat32(36),
  };

  const validation = GeoSchema.safeParse(rawData);

  if (!validation.success) {
    log.error("Zod Validation Error:", z.prettifyError(validation.error));
    return null;
  }

  return validation.data;
};

export const readTileBuff = (buffer: ArrayBuffer): ParsedTileFrame | null => {
  if (buffer.byteLength < TILE_HEADER_BYTES) {
    log.error("Insufficient buffer length for tile packet!");
    return null;
  }

  const view = new DataView(buffer);
  const frameType = view.getUint8(0);
  if (
    frameType !== TileFrameType.SNAPSHOT &&
    frameType !== TileFrameType.UPDATE
  ) {
    log.warn(`[PARSER] Unexpected tile frameType: ${frameType}`);
    return null;
  }

  const protocol = view.getUint8(1);
  if (protocol !== PROTOCOL_VERSION) {
    log.warn(`[PARSER] Unsupported tile protocol version: ${protocol}`);
  }

  const subscriptionId = view.getUint32(4);
  const stream = decodeTileStream(view.getUint8(8));
  const res = RES_BY_CODE.get(view.getUint8(9));
  const traceMask = view.getUint16(10);
  const traces = stream ? TILE_TRACES[stream] : null;
  const traceMaskLimit = traces ? (1 << traces.length) - 1 : 0;
  if (!stream || !res || !traces || traceMask === 0 || (traceMask & ~traceMaskLimit) !== 0) {
    log.warn(
      `[PARSER] Invalid tile header stream=${view.getUint8(8)} res=${view.getUint8(9)} mask=${traceMask}`,
    );
    return null;
  }

  const enabledCount = countEnabledTraces(traceMask, traces.length);
  const fromUnixMs = Number(view.getBigInt64(12));
  const toUnixMs = Number(view.getBigInt64(20));
  const replaceFromUnixMs = Number(view.getBigInt64(28));
  const binCount = view.getUint32(36);
  const binBytes = 8 + enabledCount * 3 * 4;
  const expectedBytes = TILE_HEADER_BYTES + binCount * binBytes;
  if (buffer.byteLength !== expectedBytes) {
    log.warn(
      `[PARSER] Invalid tile packet length: expected=${expectedBytes} actual=${buffer.byteLength}`,
    );
    return null;
  }

  const bins = [];
  let offset = TILE_HEADER_BYTES;
  for (let i = 0; i < binCount; i++) {
    const tsUnixMs = Number(view.getBigInt64(offset));
    offset += 8;
    const bin: TileResponse["bins"][number] = {
      ts: new Date(tsUnixMs).toISOString(),
    };

    for (let bit = 0; bit < traces.length; bit++) {
      if ((traceMask & (1 << bit)) === 0) continue;
      const min = view.getFloat32(offset);
      const max = view.getFloat32(offset + 4);
      const avg = view.getFloat32(offset + 8);
      offset += 12;
      bin[traces[bit]] = {
        min: Number.isNaN(min) ? null : min,
        max: Number.isNaN(max) ? null : max,
        avg: Number.isNaN(avg) ? null : avg,
      };
    }
    bins.push(bin);
  }

  return {
    frameType,
    kind: frameType === TileFrameType.SNAPSHOT ? "snapshot" : "update",
    subscriptionId,
    stream,
    res,
    traceMask,
    fromUnixMs,
    toUnixMs,
    replaceFromUnixMs,
    tiles: {
      stream,
      res,
      from: new Date(fromUnixMs).toISOString(),
      to: new Date(toUnixMs).toISOString(),
      bins,
    },
  };
};

function decodeTileStream(code: number): TileStreamName | null {
  if (code === TileStreamCode.DRILL) return "drill";
  if (code === TileStreamCode.GEO) return "geo";
  return null;
}

function countEnabledTraces(traceMask: number, traceCount: number): number {
  let count = 0;
  for (let bit = 0; bit < traceCount; bit++) {
    if ((traceMask & (1 << bit)) !== 0) count++;
  }
  return count;
}
