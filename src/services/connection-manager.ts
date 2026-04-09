// services/connection-manager.ts

import { createRigClient, connect, disconnect } from "./rig-client";
import { handleClosing } from "./protocol";
import { createBackoff } from "../utils/backoff";
import { parseServerMessage } from "../domain/message.schema";
import { log } from "../utils/logger";
import { StreamDef, FAST_RETRY_MS } from "../domain/constants";
import type { ConnectResult } from "./rig-client";
import type { ServerMessage, ConnectionStatus } from "../domain/message.types";
import { readDrillBuff, readGeoBuff } from "./binary-parser";

// =============================================================================
// Types
// =============================================================================

type LoopResult = { retryable: true } | { retryable: false };

export type ConnectionManagerOptions = {
  onMessage?: (msg: ServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  getClientId?: () => string | null;
  onClientIdRegistered?: (clientId: string) => void;
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
  const { onMessage, onStatusChange, getClientId, onClientIdRegistered } =
    options;

  const backoff = createBackoff();
  const client = createRigClient();

  let stopped = false;
  let runGeneration = 0;

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

      if (typeof value === "string") {
        const parsed = parseServerMessage(value);

        if (!parsed.success) {
          log.warn("[CONNECTION] Unparseable message — skipping");
          continue;
        }

        const msg = parsed.data;

        if (msg.messageType === "ALARM_RAISED") {
          const { alarm } = msg.payload;
          globalRigStore.getState().registerAlarm({
            uuid: alarm.id,
            severity: alarm.severity,
            message: alarm.message,
            timestamp: alarm.raisedAt,
          });
        }

        if (msg.messageType === "ALARM_ACKED") {
          globalRigStore.getState().resolveAlarm(msg.payload.alarm.id);
        }

        if (msg.messageType === "CLOSING") {
          const closing = handleClosing(msg);
          log.warn(
            `[CONNECTION] CLOSING — code=${closing.code} retryable=${closing.retryable}`,
          );
          return { retryable: closing.retryable };
        }

        onMessage?.(msg);
      } else if (value instanceof ArrayBuffer) {
        log.debug(
          `[CONNECTION] Binary frame received — ${value.byteLength} bytes`,
        );

        const streamId = new DataView(value).getUint8(0);

        if (streamId === StreamDef.DRILL) {
          readDrillBuff(value);
        } else if (streamId === StreamDef.GEO) {
          readGeoBuff(value);
        } else {
          log.warn(`[PARSER] Unexpected streamId: ${streamId}`);
        }
      } else {
        log.warn("[CONNECTION] Unknown message type — skipping");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Single attempt — delegasi negosiasi penuh ke rig-client.
  // connection-manager hanya tahu: berhasil atau tidak, dan perlu retry atau tidak.
  // ---------------------------------------------------------------------------
  async function attempt(): Promise<LoopResult> {
    const currentClientId = getClientId?.() ?? null;

    const result: ConnectResult = await connect(client, {
      clientId: currentClientId,
      streams: Object.values(StreamDef),
    });

    if (!result.ok) {
      log.warn(`[CONNECTION] Negotiation failed — code=${result.code}`);
      return { retryable: result.retryable };
    }

    onClientIdRegistered?.(result.clientId);

    backoff.reset();
    setStatus("ONLINE");

    return runLoop(result.reader);
  }

  // ---------------------------------------------------------------------------
  // Orchestrator — retry loop dengan backoff.
  // ---------------------------------------------------------------------------
  async function run(): Promise<void> {
    const myGeneration = ++runGeneration;
    setStatus("CONNECTING");

    while (!stopped && myGeneration === runGeneration) {
      let fastRetry = false;

      try {
        const result = await attempt();

        if (!result.retryable || stopped || myGeneration !== runGeneration) {
          log.warn("[CONNECTION] Permanent failure or stopped — giving up");
          setStatus("FAILED");
          return;
        }

        log.warn("[CONNECTION] Disconnected — will retry");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          log.debug("[CONNECTION] Aborted intentionally — exiting loop");
          return;
        }

        if (err instanceof Error && err.name === "WebSocketError") {
          log.warn(`[CONNECTION] Transient network blip — ${err.message}`);
          fastRetry = true;
        } else if (
          err instanceof Error &&
          err.name === "HandshakeTimeoutError"
        ) {
          log.warn(`[CONNECTION] ${err.message}`);
        } else {
          log.error("[CONNECTION] Attempt threw unexpectedly", String(err));
        }
      }

      if (stopped || myGeneration !== runGeneration) return;

      disconnect(client);

      if (fastRetry) {
        log.info(`[CONNECTION] Fast retry in ${FAST_RETRY_MS}ms`);
        setStatus("RECONNECTING");
        await sleep(FAST_RETRY_MS);
        continue;
      }

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
      backoff.reset();
      run();
    },

    stop(): void {
      stopped = true;
      disconnect(client);
      log.info("[CONNECTION] Stopped by caller");
    },
  };
}
