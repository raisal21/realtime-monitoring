// constants.ts

// =============================================================================
// Protocol
// =============================================================================

export const SUPPORTED_SCHEMA_ID = 1;
export const PROTOCOL_VERSION = 1;
export const HANDSHAKE_TIMEOUT_MS = 6_000;

export const StreamDef = {
  DRILL: 101,
  GEO: 102,
} as const;

export type StreamDef = (typeof StreamDef)[keyof typeof StreamDef];

// =============================================================================
// Backoff & Reconnect
// =============================================================================

export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_CAP_MS = 30_000;
export const MAX_RETRY_ATTEMPTS = 10;
export const MAX_RETRY_ELAPSED_MS = 5 * 60 * 1_000; // 5 minute
export const FAST_RETRY_MS = 500;
