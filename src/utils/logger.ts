// utils/logger.ts

// =============================================================================
// Logger
// =============================================================================

const env =
  (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env ?? {};
const logLevel = env.VITE_LOG_LEVEL;

export const log = {
  debug: (msg: string) =>
    logLevel === "debug" && console.debug(`[DEBUG] ${msg}`),
  info: (msg: string) => console.info(`[INFO]  ${msg}`),
  warn: (msg: string, extra?: unknown) =>
    console.warn(`[WARN]  ${msg}`, extra ?? ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[ERROR] ${msg}`, err ?? ""),
};
