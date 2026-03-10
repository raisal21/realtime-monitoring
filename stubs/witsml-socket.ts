import {
  setInterval,
  clearInterval,
  clearTimeout,
  setTimeout,
} from "node:timers";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";

// =============================================================================
// Protocol Types
// =============================================================================

type ClientPayloadMap = {
  HANDSHAKE: HandshakePayload;
  SUBSCRIBE: SubscribePayload;
  UNSUBSCRIBE: UnsubscribePayload;
  ALARM_ACK: AlarmAckPayload;
};

// Protocol envelope used by all client messages.
// The messageType determines the payload schema via ClientPayloadMap.
// This pattern ensures compile-time type safety for message routing.
type ClientMessage<T extends keyof ClientPayloadMap = keyof ClientPayloadMap> =
  {
    messageType: T;
    requestId?: string;
    payload: ClientPayloadMap[T];
  };

type MessageHandler<K extends keyof ClientPayloadMap> = (
  ws: RigWebSocket,
  payload: ClientPayloadMap[K],
) => void;

// =============================================================================
// Domain Models
// =============================================================================

interface HandshakePayload {
  schemaId: number;
  protocolVersion: number;
  clientId?: string;
}

interface SubscribePayload {
  streams: number[];
}

interface UnsubscribePayload {
  streams: number[];
}

interface AlarmAckPayload extends AlarmAcknowledgement {
  alarmId: string;
}

interface Alarm {
  id: string;
  code: string;
  message: string;
  severity: AlarmSeverity;
  raisedAt: number;
  acknowledged: boolean;
  acknowledgedBy?: AlarmAcknowledgement;
}

interface AlarmAcknowledgement {
  operatorName: string;
  role: string;
  timestamp: number;
}

interface ServerMessage<T = unknown> {
  messageType: string;
  timestamp: number;
  payload?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Extended WebSocket with runtime metadata used by the rig server.
// This avoids external maps and keeps connection state co-located.
interface RigWebSocket extends WebSocket {
  clientId: string;
  state: ClientState;
  isAlive: boolean;
  lastActivity: number;
  subscriptions: Set<StreamDef>;
  slowSince?: number;
  droppedFrames: number;
  handshakeTimer?: NodeJS.Timeout;
}

// =============================================================================
// Enums & Constants
// =============================================================================

enum ClientState {
  CONNECTING = "CONNECTING",
  HANDSHAKING = "HANDSHAKING",
  ACTIVE = "ACTIVE",
  IDLE = "IDLE",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
}

enum StreamDef {
  DRILL = 101,
  GEO = 102,
}

enum AlarmSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

const SUPPORTED_SCHEMA_ID = 1;
const PROTOCOL_VERSION = 1;
const HANDSHAKE_TIMEOUT_MS = 5_000;
const IDLE_TIMEOUT_MS = 15_000;
const PING_INTERVAL_MS = 10_000;
const SLOW_TIMEOUT_MS = 5_000;
const MAX_BUFFER_BYTES = 2 * 1024 * 1024; // 2 MB
const ALARM_RETENTION_MS = 24 * 60 * 60 * 1000; // 24h TTL

// =============================================================================
// State Machine
// =============================================================================

// Defines allowed lifecycle transitions for a connected client.
// Prevents invalid state mutations that could break protocol guarantees.
const ValidTransitions: Record<ClientState, ClientState[]> = {
  [ClientState.CONNECTING]: [ClientState.HANDSHAKING, ClientState.CLOSING],
  [ClientState.HANDSHAKING]: [
    ClientState.ACTIVE,
    ClientState.CLOSING,
    ClientState.CLOSED,
  ],
  [ClientState.ACTIVE]: [
    ClientState.IDLE,
    ClientState.CLOSING,
    ClientState.CLOSED,
  ],
  [ClientState.IDLE]: [
    ClientState.ACTIVE,
    ClientState.CLOSING,
    ClientState.CLOSED,
  ],
  [ClientState.CLOSING]: [ClientState.CLOSED],
  [ClientState.CLOSED]: [],
};

function transitionState(client: RigWebSocket, next: ClientState): boolean {
  // Prevent illegal state mutation to keep client lifecycle deterministic
  if (client.state === ClientState.CLOSED) return false;

  const allowed = ValidTransitions[client.state] ?? [];
  if (!allowed.includes(next)) {
    log.warn(
      `[STATE] Illegal: ${client.state} → ${next} (client=${client.clientId})`,
    );
    return false;
  }

  log.debug(`[STATE] ${client.state} → ${next} (client=${client.clientId})`);
  client.state = next;
  return true;
}

// =============================================================================
// Logger
// =============================================================================

const log = {
  debug: (msg: string) =>
    process.env.LOG_LEVEL === "debug" && console.debug(`[DEBUG] ${msg}`),
  info: (msg: string) => console.info(`[INFO]  ${msg}`),
  warn: (msg: string) => console.warn(`[WARN]  ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[ERROR] ${msg}`, err ?? ""),
};

// =============================================================================
// Runtime State
// =============================================================================

const streamSubscribers: Map<StreamDef, Set<RigWebSocket>> = new Map();

for (const stream of Object.values(StreamDef).filter(
  (v) => typeof v === "number",
) as StreamDef[]) {
  streamSubscribers.set(stream, new Set());
}

let activeAlarms: Map<string, Alarm> = new Map();
let alarmSequence: number = 0;

const activeAlarmCodes = new Set<string>();

let rigState = {
  timestamp: BigInt(Date.now()),
  depth: 1500.0,
  rpm: 120.0,
  wob: 20.0,
  torque: 5.0,
  spp: 2500.0,
  hkld: 200.0,
  gamma: 50.0,
  rop: 25.0,
  gas: 10.0,
  inc: 0.5,
  azi: 45.0,
};

let seqDrill = 0;
let seqGeo = 0;

// Binary packet layout (40 bytes)
// ------------------------------------------------
// 0   : streamId (uint8)
// 1   : protocol version (uint8)
// 4   : sequence number (uint32)
// 8   : timestamp (uint64)
// 16+ : sensor values (float32)
// ------------------------------------------------
// Layout must stay stable because clients parse this directly.
const drillBuff = new ArrayBuffer(40);
const drillView = new DataView(drillBuff);

const geoBuff = new ArrayBuffer(40);
const geoView = new DataView(geoBuff);

function sendDrillBuff() {
  drillView.setUint8(0, 101);
  drillView.setUint8(1, 1);
  drillView.setUint32(4, seqDrill++);

  drillView.setBigUint64(8, rigState.timestamp);
  drillView.setFloat32(16, rigState.depth);
  drillView.setFloat32(20, rigState.rpm);
  drillView.setFloat32(24, rigState.wob);
  drillView.setFloat32(28, rigState.torque);
  drillView.setFloat32(32, rigState.hkld);
  drillView.setFloat32(36, rigState.spp);

  broadcastBinary(drillBuff, StreamDef.DRILL);
}

function sendGeoBuff() {
  geoView.setUint8(0, 102);
  geoView.setUint8(1, 1);
  geoView.setUint32(4, seqGeo++);

  geoView.setBigUint64(8, rigState.timestamp);
  geoView.setFloat32(16, rigState.depth);
  geoView.setFloat32(20, rigState.gamma);
  geoView.setFloat32(24, rigState.rop);
  geoView.setFloat32(28, rigState.gas);
  geoView.setFloat32(32, rigState.inc);
  geoView.setFloat32(36, rigState.azi);

  broadcastBinary(geoBuff, StreamDef.GEO);
}
// =============================================================================
// Utilities
// =============================================================================

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateClientId(): string {
  return `rig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sendMessage(
  ws: RigWebSocket,
  messageType: string,
  payload?: Record<string, any>,
  error?: { code: string; message: string },
) {
  if (ws.readyState !== WebSocket.OPEN) return;

  const message: ServerMessage = {
    messageType,
    timestamp: Date.now(),
    payload,
    error,
  };

  ws.send(JSON.stringify(message));
}

function broadcastBinary(buffer: ArrayBuffer, streamId: StreamDef) {
  const now = Date.now();

  const subscribers = streamSubscribers.get(streamId);
  if (!subscribers) return;

  for (const client of subscribers) {
    const rigClient = client as RigWebSocket;

    if (rigClient.readyState !== WebSocket.OPEN) continue;
    if (rigClient.state !== ClientState.ACTIVE) continue;

    // Protect server from memory pressure caused by slow consumers.
    // If a client cannot keep up with the stream rate we drop frames
    // and eventually disconnect to preserve realtime guarantees.
    if (rigClient.bufferedAmount > MAX_BUFFER_BYTES) {
      rigClient.droppedFrames++;

      if (!rigClient.slowSince) {
        rigClient.slowSince = now;
      }

      if (now - rigClient.slowSince > SLOW_TIMEOUT_MS) {
        // Disconnect persistently slow clients to maintain realtime guarantees
        log.warn(
          `[SLOW CLIENT] ${client.clientId} disconnected — ` +
            `${client.droppedFrames} frames dropped over ${SLOW_TIMEOUT_MS}ms`,
        );
        transitionState(rigClient, ClientState.CLOSING);
        rigClient.close(1009, "Client too slow");
      }

      continue;
    }

    if (client.slowSince !== undefined) {
      client.slowSince = undefined;
      client.droppedFrames = 0;
    }

    rigClient.send(buffer);
  }
}

function broadcastJson(messageType: string, payload: Record<string, unknown>) {
  for (const ws of wss.clients) {
    const client = ws as RigWebSocket;
    if (client.state !== ClientState.ACTIVE) continue;
    if (client.readyState !== WebSocket.OPEN) continue;
    sendMessage(client, messageType, payload);
  }
}

function raiseAlarm(code: string, message: string, severity: AlarmSeverity) {
  // Prevent duplicate active alarms with same business code
  if (activeAlarmCodes.has(code)) return;

  let id = `ALM-${Date.now()}-${alarmSequence++}`;
  const now = Date.now();

  const alarm: Alarm = {
    id: id,
    code: code,
    message: message,
    severity: severity,
    raisedAt: now,
    acknowledged: false,
    acknowledgedBy: undefined,
  };

  log.info(`[ALARM RAISED] ${alarm.code} (${alarm.id})`);

  activeAlarms.set(id, alarm);
  activeAlarmCodes.add(code);

  broadcastJson("ALARM_RAISED", { alarm });
}

function mockAlarmGenerator() {
  const probability = Math.random();

  if (probability < 0.005) {
    if (!activeAlarmCodes.has("HIGH_GAS")) {
      raiseAlarm(
        "HIGH_GAS",
        "Gas exceeded safety threshold",
        AlarmSeverity.CRITICAL,
      );
    }
  }
}

function purgeExpiredAlarms() {
  const cutoff = Date.now() - ALARM_RETENTION_MS;
  let purged = 0;

  for (const [id, alarm] of activeAlarms) {
    if (alarm.acknowledged && alarm.raisedAt < cutoff) {
      activeAlarms.delete(id);
      purged++;
    }
  }

  if (purged > 0) log.debug(`[ALARM] Purged ${purged} expired alarm(s)`);
}

// =============================================================================
// Protocol Handlers
// =============================================================================

function handleHandshake(
  rigWs: RigWebSocket,
  payload: HandshakePayload | undefined,
) {
  if (rigWs.state !== ClientState.HANDSHAKING) return;

  clearTimeout(rigWs.handshakeTimer);
  rigWs.handshakeTimer = undefined;

  if (!payload || typeof payload.schemaId !== "number") {
    sendMessage(rigWs, "WELCOME", undefined, {
      code: "INVALID_SCHEMA",
      message: "schemaId must be a number",
    });
    return;
  }

  if (payload.schemaId !== SUPPORTED_SCHEMA_ID) {
    transitionState(rigWs, ClientState.CLOSING);

    sendMessage(rigWs, "WELCOME", undefined, {
      code: "UNSUPPORTED_SCHEMA",
      message: "Unsupported schemaId",
    });

    rigWs.close(1002, "Unsupported schema");
    clearTimeout(rigWs.handshakeTimer);
    return;
  }

  if (payload.clientId && typeof payload.clientId === "string") {
    rigWs.clientId = payload.clientId;
  }

  transitionState(rigWs, ClientState.ACTIVE);

  sendMessage(rigWs, "WELCOME", {
    status: "OK",
    clientId: rigWs.clientId,
    availableStreams: Object.values(StreamDef).filter(
      (v) => typeof v === "number",
    ),
    serverVersion: PROTOCOL_VERSION,
  });

  log.info(`[HANDSHAKE] Client ${rigWs.clientId} connected`);
}

function handleSubscribe(
  rigWs: RigWebSocket,
  payload: SubscribePayload | undefined,
) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to subscribe",
    });
    return;
  }

  if (!payload || !Array.isArray(payload.streams)) {
    sendMessage(rigWs, "SUBSCRIBE_ACK", undefined, {
      code: "INVALID_PAYLOAD",
      message: "streams must be an array",
    });
    return;
  }

  const accepted: StreamDef[] = [];
  const rejected: number[] = [];

  for (const id of payload.streams) {
    if (typeof id !== "number") {
      rejected.push(id);
      continue;
    }

    if (Object.values(StreamDef).includes(id)) {
      rigWs.subscriptions.add(id);

      const set = streamSubscribers.get(id);
      set?.add(rigWs);

      accepted.push(id);
    } else {
      rejected.push(id);
    }
  }

  sendMessage(rigWs, "SUBSCRIBE_ACK", {
    accepted,
    rejected,
    currentSubscriptions: Array.from(rigWs.subscriptions),
  });

  log.info(
    `[SUBSCRIBE] ${rigWs.clientId} → streams: [${Array.from(rigWs.subscriptions).join(", ")}]`,
  );
}

function handleUnsubscribe(
  rigWs: RigWebSocket,
  payload: UnsubscribePayload | undefined,
) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to unsubscribe",
    });
    return;
  }

  if (!payload || !Array.isArray(payload.streams)) {
    sendMessage(rigWs, "UNSUBSCRIBE_ACK", undefined, {
      code: "INVALID_PAYLOAD",
      message: "streams must be an array",
    });
    return;
  }

  const removed: StreamDef[] = [];
  const notFound: number[] = [];

  for (const id of payload.streams) {
    if (typeof id !== "number") {
      notFound.push(id);
      continue;
    }

    if (rigWs.subscriptions.has(id)) {
      rigWs.subscriptions.delete(id);

      const set = streamSubscribers.get(id);
      set?.delete(rigWs);

      removed.push(id);
    } else {
      notFound.push(id);
    }
  }

  sendMessage(rigWs, "UNSUBSCRIBE_ACK", {
    removed,
    notFound,
    currentSubscriptions: Array.from(rigWs.subscriptions),
  });

  log.info(
    `[UNSUBSCRIBE] ${rigWs.clientId} → streams: [${Array.from(rigWs.subscriptions).join(", ")}]`,
  );
}

function handleAlarmAck(
  rigWs: RigWebSocket,
  payload: AlarmAckPayload | undefined,
) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to acknowledge alarms",
    });
    return;
  }

  if (!payload) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_PAYLOAD",
      message: "Missing payload",
    });
    return;
  }

  const { alarmId, operatorName, role } = payload;

  if (
    typeof alarmId !== "string" ||
    typeof operatorName !== "string" ||
    typeof role !== "string"
  ) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_PAYLOAD",
      message: "alarmId, operatorName, role must be valid strings",
    });
    return;
  }

  const alarm = activeAlarms.get(alarmId);

  if (!alarm) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "ALARM_NOT_FOUND",
      message: `Alarm ${alarmId} not found`,
    });
    return;
  }

  // Idempotency guard to prevent double mutation from repeated ACK
  if (alarm.acknowledged) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "ALREADY_ACKED",
      message: `Alarm ${alarmId} already acknowledged`,
    });
    return;
  }

  const now = Date.now();

  alarm.acknowledged = true;
  alarm.acknowledgedBy = {
    operatorName,
    role,
    timestamp: now,
  };

  log.info(`[ALARM ACKED] ${alarm.id} by ${operatorName} (${role})`);

  // Allow future re-raise of same alarm code after acknowledgement
  activeAlarmCodes.delete(alarm.code);

  broadcastJson("ALARM_ACKED", { alarm });
}

function handleUnknownMessage(rigWs: RigWebSocket, messageType: any) {
  log.warn(
    `[PROTOCOL] Unknown messageType: ${messageType} from ${rigWs.clientId}`,
  );

  sendMessage(rigWs, "ERROR", undefined, {
    code: "UNKNOWN_MESSAGE_TYPE",
    message: `Unsupported messageType: ${messageType ?? "undefined"}`,
  });
}

// =============================================================================
// Dispatcher
// =============================================================================

const handlers: {
  [K in keyof ClientPayloadMap]: MessageHandler<K>;
} = {
  HANDSHAKE: handleHandshake,
  SUBSCRIBE: handleSubscribe,
  UNSUBSCRIBE: handleUnsubscribe,
  ALARM_ACK: handleAlarmAck,
};

// Message dispatcher.
// Routes incoming client messages to the appropriate protocol handler
// based on messageType.
function dispatchMessage<K extends keyof ClientPayloadMap>(
  ws: RigWebSocket,
  msg: ClientMessage<K>,
) {
  const handler = handlers[msg.messageType];

  if (!handler) {
    handleUnknownMessage(ws, msg.messageType);
    return;
  }

  handler(ws, msg.payload);
}

// =============================================================================
// WebSocket Lifecycle
// =============================================================================
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const rigWs = ws as RigWebSocket;

  rigWs.clientId = generateClientId();
  rigWs.state = ClientState.CONNECTING;
  rigWs.isAlive = true;
  rigWs.lastActivity = Date.now();
  rigWs.subscriptions = new Set();
  rigWs.droppedFrames = 0;

  log.info(`[CONNECT] ${rigWs.clientId} from ${req.socket.remoteAddress}`);

  transitionState(rigWs, ClientState.HANDSHAKING);

  // Stored on the socket so handleHandshake can cancel it after a successful handshake.
  rigWs.handshakeTimer = setTimeout(() => {
    log.warn(`[HANDSHAKE] Timeout for ${rigWs.clientId}`);
    transitionState(rigWs, ClientState.CLOSING);
    rigWs.close(1008, "Handshake timeout");
  }, HANDSHAKE_TIMEOUT_MS);

  rigWs.on("error", (err) => {
    log.error(`[WS ERROR] ${rigWs.clientId}`, err);
  });

  rigWs.on("message", (raw) => {
    rigWs.lastActivity = Date.now();

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      sendMessage(rigWs, "ERROR", undefined, {
        code: "INVALID_JSON",
        message: "Message is not valid JSON",
      });
      transitionState(rigWs, ClientState.CLOSING);
      rigWs.close(1002, "Invalid JSON");
      clearTimeout(rigWs.handshakeTimer);
      return;
    }

    if (!msg.messageType) {
      sendMessage(rigWs, "ERROR", undefined, {
        code: "INVALID_MESSAGE",
        message: "messageType is required",
      });
      return;
    }

    // Protocol contract: first message MUST be HANDSHAKE
    if (
      rigWs.state === ClientState.HANDSHAKING &&
      msg.messageType !== "HANDSHAKE"
    ) {
      log.warn(
        `[PROTOCOL] ${rigWs.clientId} sent ${msg.messageType} before HANDSHAKE`,
      );
      transitionState(rigWs, ClientState.CLOSING);
      rigWs.close(1002, "Expected HANDSHAKE as first message");
      clearTimeout(rigWs.handshakeTimer);
      return;
    }

    dispatchMessage(rigWs, msg);
  });

  rigWs.on("pong", () => {
    rigWs.isAlive = true;
    rigWs.lastActivity = Date.now();
    if (rigWs.state === ClientState.IDLE) {
      transitionState(rigWs, ClientState.ACTIVE);
    }
  });

  rigWs.on("close", (code, reason) => {
    clearTimeout(rigWs.handshakeTimer);

    // Remove client from all stream subscriber sets
    for (const stream of rigWs.subscriptions) {
      streamSubscribers.get(stream)?.delete(rigWs);
    }

    transitionState(rigWs, ClientState.CLOSED);
    log.info(
      `[DISCONNECT] ${rigWs.clientId} — code=${code} reason="${reason}" ` +
        `droppedFrames=${rigWs.droppedFrames}`,
    );
  });
});

wss.on("listening", () => {
  log.info("[SERVER] witsml-socket listening on ws://0.0.0.0:8080");
});

wss.on("error", (err) => {
  log.error("[SERVER] Fatal error", err);
  process.exit(1);
});
// =============================================================================
// Background Jobs
// =============================================================================

const pingInterval = setInterval(() => {
  const now = Date.now();

  for (const ws of wss.clients) {
    const client = ws as RigWebSocket;

    // Dead — no pong received since last ping
    if (!client.isAlive) {
      log.warn(`[PING] No pong from ${client.clientId} — terminating`);
      transitionState(client, ClientState.CLOSING);
      client.terminate();
      continue;
    }

    client.isAlive = false;

    // Demote inactive ACTIVE clients to IDLE to reduce broadcast load
    if (
      client.state === ClientState.ACTIVE &&
      now - client.lastActivity > IDLE_TIMEOUT_MS
    ) {
      transitionState(client, ClientState.IDLE);
      log.info(`[IDLE] ${client.clientId} demoted to IDLE`);
    }

    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  }
}, PING_INTERVAL_MS);

// Alarm TTL purge — runs every hour, removes old acknowledged alarms
const alarmPurgeInterval = setInterval(purgeExpiredAlarms, 60 * 60 * 1000);

// Telemetry tick — updates rig state and drives stream broadcasts.
// Drill runs every tick (100ms). Geo runs every 10th tick (1s).
let tick = 0;

const telemetryInterval = setInterval(() => {
  try {
    rigState.timestamp = BigInt(Date.now());
    rigState.depth += 0.01;
    rigState.rpm = getRandom(115, 125);
    rigState.wob = getRandom(18, 22);
    rigState.torque = getRandom(4, 6);
    rigState.spp = getRandom(2450, 2550);
    rigState.hkld = getRandom(190, 210);

    // Drill broadcasts every tick (100ms), geo every 10th tick (1s).
    sendDrillBuff();

    if (tick % 10 === 0) {
      rigState.gamma = getRandom(40, 60);
      rigState.rop = getRandom(20, 30);
      rigState.gas = getRandom(5, 15);
      sendGeoBuff();
    }

    mockAlarmGenerator();
    tick++;
  } catch (err) {
    log.error("[TICK] Critical error in telemetry tick", err);
  }
}, 100);

// Graceful shutdown
function shutdown(signal: string) {
  log.info(`[SHUTDOWN] Received ${signal} — shutting down`);

  clearInterval(pingInterval);
  clearInterval(alarmPurgeInterval);
  clearInterval(telemetryInterval);

  wss.close(() => {
    log.info("[SHUTDOWN] Server closed cleanly");
    process.exit(0);
  });

  setTimeout(() => {
    log.warn("[SHUTDOWN] Force exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

wss.on("close", () => {
  clearInterval(pingInterval);
  clearInterval(alarmPurgeInterval);
  clearInterval(telemetryInterval);
});
