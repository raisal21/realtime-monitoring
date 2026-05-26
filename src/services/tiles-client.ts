import type { Envelope, EnvelopePoint } from "@/lib/bin-mm";

// Mirrors witsml-socket-cs/Tiles.cs. GET /api/tiles returns pre-aggregated
// min/max/avg per trace per time bucket — already the shape LogTrack's
// BIN-MM envelope renders, so no client-side decimation happens here.

export type TileRes = "1s" | "10s" | "1m" | "5m" | "1h";

interface TileStat {
  min: number | null;
  max: number | null;
  avg: number | null;
}

// `ts` is the bucket timestamp (ISO8601); every other key is a trace name
// carrying a TileStat — the backend serializes traces as JSON extension data.
interface TileBin {
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

// Same-origin fetch — the Vite dev proxy forwards /api to the backend, so no
// CORS handling is needed (witsml NAPKIN 2026-05-20 — Security posture).
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
      // non-JSON error body — keep the status-code message
    }
    throw new TileFetchError("bad-request", message);
  }

  return (await resp.json()) as TileResponse;
}

function asStat(v: string | TileStat | undefined): TileStat | undefined {
  return v != null && typeof v === "object" ? v : undefined;
}

// Tile bins → BIN-MM envelope: one min point + one max point per bucket,
// y-positioned at the bucket timestamp. Feeds LogTrack's envelope renderer —
// the same path Layer 2's live ring uses, no second render path.
export function tileEnvelope(tiles: TileResponse, trace: string): Envelope {
  const min: EnvelopePoint[] = [];
  const max: EnvelopePoint[] = [];
  for (const bin of tiles.bins) {
    const stat = asStat(bin[trace]);
    if (!stat) continue;
    const y = Date.parse(bin.ts);
    if (Number.isNaN(y)) continue;
    if (stat.min != null) min.push([stat.min, y]);
    if (stat.max != null) max.push([stat.max, y]);
  }
  return { min, max };
}
