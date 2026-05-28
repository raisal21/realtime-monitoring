// constants.ts

// =============================================================================
// Protocol
// =============================================================================

export const SUPPORTED_SCHEMA_ID = 1;
export const PROTOCOL_VERSION = 1;
export const HANDSHAKE_TIMEOUT_MS = 6_000;
const env =
  (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env ?? {};
export const WS_URL = env.VITE_WS_URL ?? "ws://localhost:8080";
export const WS_TOKEN = env.VITE_WS_TOKEN ?? "";

export const StreamDef = {
  DRILL: 101,
  GEO: 102,
} as const;

export type StreamDef = (typeof StreamDef)[keyof typeof StreamDef];

export const TileFrameType = {
  SNAPSHOT: 201,
  UPDATE: 202,
} as const;

export type TileFrameType = (typeof TileFrameType)[keyof typeof TileFrameType];

export const TileStreamCode = {
  DRILL: 1,
  GEO: 2,
} as const;

export type TileStreamCode =
  (typeof TileStreamCode)[keyof typeof TileStreamCode];

export const TileResCode = {
  "1s": 1,
  "10s": 2,
  "1m": 3,
  "5m": 4,
  "1h": 5,
} as const;

// =============================================================================
// Backoff & Reconnect
// =============================================================================

export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_CAP_MS = 30_000;
export const MAX_RETRY_ATTEMPTS = 10;
export const MAX_RETRY_ELAPSED_MS = 5 * 60 * 1_000; // 5 minute
export const FAST_RETRY_MS = 500;
