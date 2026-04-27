// services/connection-manager.ts

import { createRigClient, connect, disconnect } from "@/services/rig-client";
import {
  handleClosing,
  handleSubscribeAck,
  handleUnsubscribeAck,
} from "@/services/protocol";
import { createBackoff } from "@/utils/backoff";
import { parseServerMessage } from "@/domain/message.schema";
import { log } from "@/utils/logger";
import { StreamDef, FAST_RETRY_MS } from "@/domain/constants";
import type { ConnectResult } from "./rig-client";
import type { ServerMessage, ConnectionStatus } from "@/domain/message.types";
import { readDrillBuff, readGeoBuff } from "@/services/binary-parser";
import { globalRigStore } from "@/store/index-store";

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
  send(payload: object): void;
  retry(): void;
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
  let activeWriter: WritableStreamDefaultWriter<string> | null = null;
  let running = false;

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
            id: alarm.id,
            severity: alarm.severity,
            message: alarm.message,
            timestamp: alarm.raisedAt,
          });
        }

        if (msg.messageType === "ALARM_ACKED") {
          globalRigStore.getState().resolveAlarm(msg.payload.alarm.id);
        }

        if (msg.messageType === "SUBSCRIBE_ACK") {
          const ack = handleSubscribeAck(msg);

          // currentSubscriptions adalah kebenaran mutlak — langsung pakai
          globalRigStore.getState().reconcileTopics(ack.currentSubscriptions);

          if (ack.rejected.length > 0) {
            log.warn(
              `[CONNECTION] SUBSCRIBE_ACK — rejected: [${ack.rejected}]`,
            );
          }
        }

        if (msg.messageType === "UNSUBSCRIBE_ACK") {
          const ack = handleUnsubscribeAck(msg);

          globalRigStore.getState().reconcileTopics(ack.currentSubscriptions);

          if (ack.notFound.length > 0) {
            log.warn(
              `[CONNECTION] UNSUBSCRIBE_ACK — notFound: [${ack.notFound}]`,
            );
          }
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
          const drillData = readDrillBuff(value);

          if (drillData) {
            globalRigStore.getState().insertDrillPoint(drillData);
          }
        } else if (streamId === StreamDef.GEO) {
          const geoData = readGeoBuff(value);

          if (geoData) {
            globalRigStore.getState().insertGeoPoint(geoData);
          }
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

    activeWriter = result.writer;
    onClientIdRegistered?.(result.clientId);

    backoff.reset();
    setStatus("ONLINE");

    globalRigStore.getState().restoreSubscriptions();

    return runLoop(result.reader);
  }

  // ---------------------------------------------------------------------------
  // Orchestrator — retry loop dengan backoff.
  // ---------------------------------------------------------------------------
  async function run(): Promise<void> {
    running = true;
    const myGeneration = ++runGeneration;
    setStatus("CONNECTING");
    try {
      while (!stopped && myGeneration === runGeneration) {
        let fastRetry = false;

        try {
          const result = await attempt();

          if (!result.retryable || stopped || myGeneration !== runGeneration) {
            log.warn("[CONNECTION] Permanent failure or stopped — giving up");
            setStatus("ERROR");
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
          setStatus("ERROR");
          return;
        }
        globalRigStore.getState().setAttempt(next.attempt);

        log.info(
          `[CONNECTION] Retrying in ${Math.round(next.delayMs / 1_000)}s`,
        );

        globalRigStore.getState().setDelay(next.delayMs);
        setStatus("RECONNECTING");
        await sleep(next.delayMs);
      }
    } finally {
      running = false;
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

    send(payload: object): void {
      if (!activeWriter) {
        log.warn("[CONNECTION] Cannot send message: Not connected");
        return;
      }
      activeWriter.write(JSON.stringify(payload)).catch((err) => {
        log.error("[CONNECTION] Failed to send message", err);
      });
    },

    retry(): void {
      if (running) {
        log.warn(
          "[CONNECTION] retry() called while already running — ignoring",
        );
        return;
      }
      log.info("[CONNECTION] Manual retry triggered");
      stopped = false;
      backoff.reset();
      run();
    },
  };
}
