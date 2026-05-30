// services/connection-manager.ts

import { createRigClient, connect, disconnect } from "@/services/rig-client";
import {
  handleClosing,
  handleSubscribeAck,
  handleTileSubscribeAck,
  handleTileUnsubscribeAck,
  handleUnsubscribeAck,
} from "@/services/protocol";
import { createBackoff } from "@/utils/backoff";
import { parseServerMessage } from "@/domain/message.schema";
import { log } from "@/utils/logger";
import { StreamDef, FAST_RETRY_MS, TileFrameType } from "@/domain/constants";
import type { ConnectResult } from "./rig-client";
import type { ConnectionStatus } from "@/domain/message.types";
import {
  readDrillBuff,
  readGeoBuff,
  readTileBuff,
} from "@/services/binary-parser";
import { globalRigStore } from "@/store/index-store";

// =============================================================================
// Types
// =============================================================================

type LoopResult = { retryable: true } | { retryable: false };

export type ConnectionManagerOptions = {
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
  const { getClientId, onClientIdRegistered } = options;

  const backoff = createBackoff();
  const client = createRigClient();

  let stopped = false;
  let runGeneration = 0;
  let activeWriter: WritableStreamDefaultWriter<string> | null = null;
  let running = false;

  function setStatus(status: ConnectionStatus): void {
    log.debug(`[CONNECTION] Status → ${status}`);
    globalRigStore.getState().updateConnectionStatus(status);
  }

  // =============================================================================
  // Message loop — runs only after a successful negotiation.
  // =============================================================================
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

        if (msg.messageType === "HEARTBEAT") {
          if (activeWriter) {
            activeWriter
              .write(JSON.stringify({ messageType: "HEARTBEAT" }))
              .catch((err) =>
                log.warn(`[CONNECTION] HEARTBEAT reply failed: ${err}`),
              );
          }
          continue;
        }

        if (msg.messageType === "ERROR") {
          globalRigStore.getState().pushToast({
            tone: "error",
            code: msg.error.code,
            message: msg.error.message,
          });
          if (
            msg.error.code === "HISTORY_EXTENT_FAILED" ||
            msg.error.code === "INVALID_HISTORY_STREAM"
          ) {
            globalRigStore.getState().setHistoryExtentError(msg.error.message);
          }
          continue;
        }

        if (msg.messageType === "ALARM_RAISED") {
          const { alarm } = msg.payload;
          globalRigStore.getState().registerAlarm({
            id: alarm.id,
            code: alarm.code,
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

          // currentSubscriptions is the source of truth — use it directly
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

        if (msg.messageType === "TILE_SUBSCRIBE_ACK") {
          const ack = handleTileSubscribeAck(msg);
          if (ack.accepted.length === 0) {
            globalRigStore
              .getState()
              .setTileError("Tile subscription was rejected");
          }
          if (ack.rejected.length > 0) {
            log.warn(
              `[CONNECTION] TILE_SUBSCRIBE_ACK — rejected: [${ack.rejected}]`,
            );
          }
        }

        if (msg.messageType === "TILE_UNSUBSCRIBE_ACK") {
          handleTileUnsubscribeAck(msg);
        }

        if (msg.messageType === "HISTORY_EXTENT") {
          globalRigStore.getState().setHistoryExtent(msg.payload);
        }

        if (msg.messageType === "CLOSING") {
          const closing = handleClosing(msg);
          log.warn(
            `[CONNECTION] CLOSING — code=${closing.code} retryable=${closing.retryable}`,
          );
          globalRigStore.getState().pushToast({
            tone: "warning",
            code: closing.code,
            message: closing.reason,
          });
          if (!closing.retryable) {
            globalRigStore.getState().setError({
              code: closing.code,
              reason: closing.reason,
            });
          }
          return { retryable: closing.retryable };
        }
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
        } else if (
          streamId === TileFrameType.SNAPSHOT ||
          streamId === TileFrameType.UPDATE
        ) {
          const tileFrame = readTileBuff(value);
          if (tileFrame?.kind === "snapshot") {
            globalRigStore.getState().applyTileSnapshot(tileFrame);
          } else if (tileFrame?.kind === "update") {
            globalRigStore.getState().applyTileUpdate(tileFrame);
          }
        } else {
          log.warn(`[PARSER] Unexpected streamId: ${streamId}`);
        }
      } else {
        log.warn("[CONNECTION] Unknown message type — skipping");
      }
    }
  }

  // =============================================================================
  // Single attempt — full negotiation delegated to rig-client.
  // connection-manager only knows: succeeded or not, and whether to retry.
  // =============================================================================
  async function attempt(): Promise<LoopResult> {
    const currentClientId = getClientId?.() ?? null;

    const result: ConnectResult = await connect(client, {
      clientId: currentClientId,
    });

    if (!result.ok) {
      log.warn(`[CONNECTION] Negotiation failed — code=${result.code}`);
      if (!result.retryable) {
        globalRigStore.getState().setError({
          code: result.code,
          reason: "Handshake rejected",
        });
      }
      return { retryable: result.retryable };
    }

    activeWriter = result.writer;
    onClientIdRegistered?.(result.clientId);

    backoff.reset();
    setStatus("ONLINE");

    globalRigStore.getState().restoreSubscriptions();

    return runLoop(result.reader);
  }

  // =============================================================================
  // Orchestrator — retry loop with backoff.
  // =============================================================================
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
          globalRigStore.getState().setError({
            code: "BACKOFF_EXHAUSTED",
            reason: next.reason,
          });
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

  // =============================================================================
  // Public API
  // =============================================================================
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
