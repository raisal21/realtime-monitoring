import type { Envelope, EnvelopePoint } from "@/lib/bin-mm";

// Mirrors witsml-socket-cs/Tiles.cs. GET /api/tiles returns pre-aggregated
// min/max/avg per trace per time bucket. Tile buckets do not preserve
// intra-bucket order, so LogTrack draws avg as the single visible line.

export type TileRes = "1s" | "10s" | "1m" | "5m" | "1h" | "6h";

export interface TileStat {
  min: number | null;
  max: number | null;
  avg: number | null;
}

// `ts` is the bucket timestamp (ISO8601); every other key is a trace name
// carrying a TileStat — the backend serializes traces as JSON extension data.
export interface TileBin {
  ts: string;
  [trace: string]: string | TileStat | undefined;
}

export interface TileResponse {
  stream: string;
  res: string;
  from: string;
  to: string;
  bins: TileBin[];
}

export type TileRange = { min: number; max: number };

export type TileDepthPoint = { timestamp: number; depth: number };

type TileEnvelopeAxis = "time" | "depth";

export type TileErrorKind = "bad-request" | "unavailable" | "network";

export class TileFetchError extends Error {
  readonly kind: TileErrorKind;
  constructor(kind: TileErrorKind, message: string) {
    super(message);
    this.name = "TileFetchError";
    this.kind = kind;
  }
}

export interface TileQuery {
  stream: "drill" | "geo";
  from: string; // ISO8601
  to: string; // ISO8601
  res: TileRes;
}

const TILE_BUCKET_MS: Record<TileRes, number> = {
  "1s": 1_000,
  "10s": 10_000,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "1h": 60 * 60_000,
  "6h": 6 * 60 * 60_000,
};

// Same-origin fetch - the Vite dev proxy forwards /api to the backend, so no
// CORS handling is needed (witsml NAPKIN 2026-05-20 - Security posture).
export async function fetchTiles(q: TileQuery): Promise<TileResponse> {
  const qs = new URLSearchParams({
    stream: q.stream,
    from: q.from,
    to: q.to,
    res: q.res,
  });

  let resp: Response;
  try {
    resp = await fetch(`/api/tiles?${qs.toString()}`);
  } catch {
    throw new TileFetchError("network", "Cannot reach the tile service");
  }

  if (resp.status === 503) {
    throw new TileFetchError("unavailable", "History store is unavailable");
  }
  if (!resp.ok) {
    let message = `Tile request failed (${resp.status})`;
    try {
      const body = (await resp.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // non-JSON error body - keep the status-code message
    }
    throw new TileFetchError("bad-request", message);
  }

  return (await resp.json()) as TileResponse;
}

function asStat(v: string | TileStat | undefined): TileStat | undefined {
  return v != null && typeof v === "object" ? v : undefined;
}

// Tile bins -> envelope: keep min/max for safety data, but expose one
// representative visible line because bucket extrema have no ordering.
export function tileEnvelope(
  tiles: TileResponse,
  trace: string,
  yAxis: TileEnvelopeAxis = "time",
): Envelope {
  const min: EnvelopePoint[] = [];
  const max: EnvelopePoint[] = [];
  const line: EnvelopePoint[] = [];
  for (const bin of tiles.bins) {
    const stat = asStat(bin[trace]);
    if (!stat) continue;
    const y = tileEnvelopeY(bin, yAxis);
    if (y == null) continue;
    if (stat.min != null) min.push([stat.min, y]);
    if (stat.max != null) max.push([stat.max, y]);
    const value = tileLineValue(stat);
    if (value != null) line.push([value, y]);
  }
  return { min, max, line };
}

export function tileDataRange(tiles: TileResponse): TileRange | null {
  let min = Infinity;
  let max = -Infinity;
  for (const bin of tiles.bins) {
    const ts = Date.parse(bin.ts);
    if (!Number.isFinite(ts)) continue;
    min = Math.min(min, ts);
    max = Math.max(max, ts);
  }
  return min <= max ? { min, max } : null;
}

export function sharedTileDataRange(
  drill: TileResponse,
  geo: TileResponse,
  requested: TileRange,
): TileRange {
  const drillRange = tileDataRange(drill);
  const geoRange = tileDataRange(geo);
  if (drillRange && geoRange) {
    const min = Math.max(drillRange.min, geoRange.min);
    const max = Math.min(drillRange.max, geoRange.max);
    if (max >= min) return { min, max };
    return {
      min: Math.min(drillRange.min, geoRange.min),
      max: Math.max(drillRange.max, geoRange.max),
    };
  }
  return drillRange ?? geoRange ?? requested;
}

export function mergeTileResponse(
  current: TileResponse | null,
  incoming: TileResponse,
  replaceFromUnixMs: number,
): TileResponse {
  const merged = new Map<string, TileBin>();
  for (const bin of current?.bins ?? []) {
    const ts = Date.parse(bin.ts);
    if (!Number.isFinite(ts) || ts >= replaceFromUnixMs) continue;
    merged.set(String(ts), bin);
  }
  for (const bin of incoming.bins) {
    const ts = Date.parse(bin.ts);
    if (!Number.isFinite(ts)) continue;
    merged.set(String(ts), bin);
  }
  const bins = [...merged.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, bin]) => bin);

  return {
    stream: incoming.stream,
    res: incoming.res,
    from: incoming.from,
    to: incoming.to,
    bins,
  };
}

export function projectOpenTileBucket(
  tiles: TileResponse,
  toUnixMs: number,
): TileResponse {
  const bucketMs = TILE_BUCKET_MS[tiles.res as TileRes];
  if (!bucketMs || !Number.isFinite(toUnixMs) || tiles.bins.length === 0) {
    return tiles;
  }

  let lastIndex = -1;
  let lastTs = -Infinity;
  for (let i = 0; i < tiles.bins.length; i++) {
    const ts = Date.parse(tiles.bins[i].ts);
    if (!Number.isFinite(ts) || ts < lastTs) continue;
    lastTs = ts;
    lastIndex = i;
  }
  if (lastIndex < 0) return tiles;

  const currentBucketStart = Math.floor(toUnixMs / bucketMs) * bucketMs;
  if (lastTs < currentBucketStart || lastTs > toUnixMs) return tiles;

  const bins = tiles.bins.map((bin, index) =>
    index === lastIndex ? { ...bin, ts: new Date(toUnixMs).toISOString() } : bin,
  );
  return {
    ...tiles,
    to: new Date(toUnixMs).toISOString(),
    bins,
  };
}

export function tileDepthRange(tiles: TileResponse): TileRange | null {
  const points = tileDepthPoints(tiles);
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    min = Math.min(min, point.depth);
    max = Math.max(max, point.depth);
  }
  return min <= max ? { min, max } : null;
}

export function sharedTileDepthRange(
  drill: TileResponse,
  geo: TileResponse,
): TileRange | null {
  return tileDepthRange(drill) ?? tileDepthRange(geo);
}

export function tileDepthPoints(tiles: TileResponse): TileDepthPoint[] {
  const points: TileDepthPoint[] = [];
  for (const bin of tiles.bins) {
    const timestamp = Date.parse(bin.ts);
    if (!Number.isFinite(timestamp)) continue;
    const stat = asStat(bin.depth);
    if (!stat) continue;
    const depth = tileLineValue(stat);
    if (depth == null || !Number.isFinite(depth)) continue;
    points.push({ timestamp, depth });
  }
  return points.sort((a, b) => a.timestamp - b.timestamp);
}

export function projectDepthAtTime(
  points: readonly TileDepthPoint[],
  timestamp: number,
): number | null {
  if (!Number.isFinite(timestamp) || points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (timestamp <= first.timestamp) return first.depth;
  if (timestamp >= last.timestamp) return last.depth;

  let lo = 0;
  let hi = points.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const point = points[mid];
    if (point.timestamp === timestamp) return point.depth;
    if (point.timestamp < timestamp) lo = mid + 1;
    else hi = mid - 1;
  }

  const prev = points[hi];
  const next = points[lo];
  if (!prev || !next) return null;
  if (next.timestamp === prev.timestamp) return next.depth;
  const t = (timestamp - prev.timestamp) / (next.timestamp - prev.timestamp);
  return prev.depth + (next.depth - prev.depth) * t;
}

export function projectTimeAtDepth(
  points: readonly TileDepthPoint[],
  depth: number,
): number | null {
  if (!Number.isFinite(depth) || points.length === 0) return null;

  let minDepth = Infinity;
  let maxDepth = -Infinity;
  let minDepthTime = points[0].timestamp;
  let maxDepthTime = points[0].timestamp;
  for (const point of points) {
    if (point.depth < minDepth) {
      minDepth = point.depth;
      minDepthTime = point.timestamp;
    }
    if (point.depth > maxDepth) {
      maxDepth = point.depth;
      maxDepthTime = point.timestamp;
    }
  }
  if (depth <= minDepth) return minDepthTime;
  if (depth >= maxDepth) return maxDepthTime;

  let projected: number | null = null;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    const lo = Math.min(prev.depth, next.depth);
    const hi = Math.max(prev.depth, next.depth);
    if (depth < lo || depth > hi) continue;
    if (next.depth === prev.depth) {
      projected = next.timestamp;
    } else {
      const t = (depth - prev.depth) / (next.depth - prev.depth);
      projected = prev.timestamp + (next.timestamp - prev.timestamp) * t;
    }
  }
  return projected;
}

function tileEnvelopeY(bin: TileBin, yAxis: TileEnvelopeAxis): number | null {
  if (yAxis === "time") {
    const y = Date.parse(bin.ts);
    return Number.isFinite(y) ? y : null;
  }
  const stat = asStat(bin.depth);
  return stat ? tileLineValue(stat) : null;
}

function tileLineValue(stat: TileStat): number | null {
  if (stat.avg != null) return stat.avg;
  if (stat.min != null && stat.max != null) {
    return (stat.min + stat.max) / 2;
  }
  return stat.min ?? stat.max ?? null;
}
