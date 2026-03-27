// services/connection-manager.ts

import { createRigClient, connect, disconnect } from "./rig-client";
import { handleClosing } from "./protocol";
import { createBackoff } from "../utils/backoff";
import { ServerSchema } from "../domain/message.schema";
import { log } from "../utils/logger";
import { StreamDef } from "../domain/constants";
import type { ConnectResult } from "./rig-client";
import type { ServerMessage } from "../domain/message.types";

// =============================================================================
// Types
// =============================================================================

export type ConnectionStatus =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "FAILED";

type LoopResult = { retryable: true } | { retryable: false };

export type ConnectionManagerOptions = {
  onMessage?: (msg: ServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
};

export type ConnectionManager = {
  start(): void;
  stop(): void;
};

// =============================================================================
// Helpers
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Factory
// =============================================================================

export function createConnectionManager(
  options: ConnectionManagerOptions = {},
): ConnectionManager {
  const { onMessage, onStatusChange } = options;

  const backoff = createBackoff();
  const client = createRigClient();

  let persistedClientId: string | null = null;
  let stopped = false;

  function setStatus(status: ConnectionStatus): void {
    log.debug(`[CONNECTION] Status → ${status}`);
    onStatusChange?.(status);
  }

  // ---------------------------------------------------------------------------
  // Message loop — hanya berjalan setelah negosiasi sukses.
  // ---------------------------------------------------------------------------
  async function runLoop(
    reader: ReadableStreamDefaultReader<unknown>,
  ): Promise<LoopResult> {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        log.warn("[CONNECTION] Stream closed by server");
        return { retryable: true };
      }

      const parsed = ServerSchema.safeParse(value);

      if (!parsed.success) {
        log.warn("[CONNECTION] Unparseable message — skipping");
        continue;
      }

      const msg = parsed.data;

      if (msg.messageType === "CLOSING") {
        const closing = handleClosing(msg);
        log.warn(
          `[CONNECTION] CLOSING — code=${closing.code} retryable=${closing.retryable}`,
        );
        return { retryable: closing.retryable };
      }

      onMessage?.(msg);
    }
  }

  // ---------------------------------------------------------------------------
  // Single attempt — delegasi negosiasi penuh ke rig-client.
  // connection-manager hanya tahu: berhasil atau tidak, dan perlu retry atau tidak.
  // ---------------------------------------------------------------------------
  async function attempt(): Promise<LoopResult> {
    const result: ConnectResult = await connect(client, {
      clientId: persistedClientId,
      streams: Object.values(StreamDef),
    });

    if (!result.ok) {
      log.warn(`[CONNECTION] Negotiation failed — code=${result.code}`);
      return { retryable: result.retryable };
    }

    persistedClientId = result.clientId;
    backoff.reset();
    setStatus("CONNECTED");

    return runLoop(result.reader);
  }

  // ---------------------------------------------------------------------------
  // Orchestrator — retry loop dengan backoff.
  // ---------------------------------------------------------------------------
  async function run(): Promise<void> {
    setStatus("CONNECTING");

    while (!stopped) {
      try {
        const result = await attempt();

        if (!result.retryable || stopped) {
          log.warn("[CONNECTION] Permanent failure or stopped — giving up");
          setStatus("FAILED");
          return;
        }

        log.warn("[CONNECTION] Disconnected — will retry");
      } catch (err) {
        // Unexpected error — socket sudah ditutup rapi oleh connect() via try-catch
        log.error("[CONNECTION] Attempt threw unexpectedly", String(err));
      }

      // Pastikan socket bersih sebelum retry
      disconnect(client);

      const next = backoff.next();

      if (!next.shouldRetry) {
        log.warn(`[CONNECTION] Backoff exhausted — reason=${next.reason}`);
        setStatus("FAILED");
        return;
      }

      log.info(`[CONNECTION] Retrying in ${Math.round(next.delayMs / 1_000)}s`);
      setStatus("RECONNECTING");
      await sleep(next.delayMs);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    start(): void {
      stopped = false;
      run();
    },

    stop(): void {
      stopped = true;
      disconnect(client);
      log.info("[CONNECTION] Stopped by caller");
    },
  };
}
