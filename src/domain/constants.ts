export const SUPPORTED_SCHEMA_ID = 1;
export const PROTOCOL_VERSION = 1;
export const HANDSHAKE_TIMEOUT_MS = 3_000;

export const StreamDef = {
  DRILL: 101,
  GEO: 102,
} as const;

export type StreamDef = (typeof StreamDef)[keyof typeof StreamDef];
