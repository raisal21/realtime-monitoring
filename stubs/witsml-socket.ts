import { setInterval } from "node:timers";
import { WebSocket, WebSocketServer } from "ws";

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

interface ServerMessage<T = any> {
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

const MAX_BUFFER = 2 * 1024 * 1024;
const SLOW_TIMEOUT = 5000;
const IDLE_TIMEOUT_MS = 15000;

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

function transitionState(client: RigWebSocket, nextState: ClientState) {
  // Prevent illegal state mutation to keep client lifecycle deterministic
  if (client.state === ClientState.CLOSED) return;

  const allowed = ValidTransitions[client.state] || [];
  if (allowed.includes(nextState)) {
    console.debug(`[STATE] ${client.state} → ${nextState}`);
    client.state = nextState;
  } else {
    console.warn(
      `[STATE ERROR] Ilegal transisi: ${client.state} -> ${nextState}`,
    );
  }
}

// =============================================================================
// Runtime State
// =============================================================================

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

  broadcast(drillBuff, StreamDef.DRILL);
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

  broadcast(geoBuff, StreamDef.GEO);
}
// =============================================================================
// Utilities
// =============================================================================

function heartbeat(ws: RigWebSocket) {
  ws.isAlive = true;
  ws.lastActivity = Date.now();
  // Hanya kembalikan ke ACTIVE jika sebelumnya dia benar-benar IDLE
  if (ws.state === ClientState.IDLE) {
    transitionState(ws, ClientState.ACTIVE);
  }
}

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
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

function broadcast(buffer: ArrayBuffer, streamId: StreamDef) {
  const now = Date.now();

  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;

    if (rigClient.readyState !== WebSocket.OPEN) continue;
    if (rigClient.state !== ClientState.ACTIVE) continue;
    if (!rigClient.subscriptions.has(streamId)) continue;

    // Protect server from memory pressure caused by slow consumers.
    // If a client cannot keep up with the stream rate we drop frames
    // and eventually disconnect to preserve realtime guarantees.
    if (rigClient.bufferedAmount > MAX_BUFFER) {
      rigClient.droppedFrames++;

      if (!rigClient.slowSince) {
        rigClient.slowSince = now;
      }

      if (now - rigClient.slowSince > SLOW_TIMEOUT) {
        // Disconnect persistently slow clients to maintain realtime guarantees
        console.warn(
          `[SLOW CLIENT] Disconnected after ${SLOW_TIMEOUT}ms buffer overflow`,
        );

        transitionState(rigClient, ClientState.CLOSING);
        rigClient.close(1009, "Client too slow");
      }

      return;
    }

    rigClient.slowSince = undefined;

    rigClient.send(buffer);
  }
}

function broadcastAlarmRaised(alarm: Alarm) {
  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;

    if (rigClient.state !== ClientState.ACTIVE) continue;
    if (rigClient.readyState !== WebSocket.OPEN) continue;

    sendMessage(rigClient, "ALARM_RAISED", { alarm });
  }
}

function broadcastAlarmAcked(alarm: Alarm) {
  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;
    if (rigClient.state !== ClientState.ACTIVE) continue;

    sendMessage(rigClient, "ALARM_ACKED", { alarm });
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

  console.info(`[ALARM RAISED] ${alarm.code} (${alarm.id})`);

  activeAlarms.set(id, alarm);
  activeAlarmCodes.add(code);

  broadcastAlarmRaised(alarm);
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

// =============================================================================
// Protocol Handlers
// =============================================================================

function handleHandshake(
  rigWs: RigWebSocket,
  payload: HandshakePayload | undefined,
) {
  if (rigWs.state !== ClientState.HANDSHAKING) return;

  if (!payload || typeof payload.schemaId !== "number") {
    sendMessage(rigWs, "WELCOME", undefined, {
      code: "INVALID_SCHEMA",
      message: "schemaId must be a number",
    });
    return;
  }

  if (payload.schemaId !== 1) {
    transitionState(rigWs, ClientState.CLOSING);

    sendMessage(rigWs, "WELCOME", undefined, {
      code: "UNSUPPORTED_SCHEMA",
      message: "Unsupported schemaId",
    });

    rigWs.close(1002, "Unsupported schema");
    clearTimeout(rigWs.handshakeTimer);
    return;
  }

  transitionState(rigWs, ClientState.ACTIVE);

  sendMessage(rigWs, "WELCOME", {
    status: "OK",
    availableStreams: Object.values(StreamDef),
  });

  console.log("Client Handshaked!");

  clearTimeout(rigWs.handshakeTimer);
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

  console.log(`Subscription updated →`, Array.from(rigWs.subscriptions));
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

  console.log(`Subscription updated →`, Array.from(rigWs.subscriptions));
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

  console.info(`[ALARM ACKED] ${alarm.id} by ${operatorName} (${role})`);

  // Allow future re-raise of same alarm code after acknowledgement
  activeAlarmCodes.delete(alarm.code);

  broadcastAlarmAcked(alarm);
}

function handleUnknownMessage(rigWs: RigWebSocket, messageType: any) {
  console.warn(`[PROTOCOL WARNING] Unknown message:`, messageType);

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

wss.on("connection", (ws: WebSocket) => {
  const rigWs = ws as RigWebSocket;

  rigWs.state = ClientState.CONNECTING;
  rigWs.isAlive = true;
  rigWs.lastActivity = Date.now();
  rigWs.subscriptions = new Set();

  console.log("Client connected. Waiting for handshake");

  transitionState(rigWs, ClientState.HANDSHAKING);

  const handshakeTimer = setTimeout(() => {
    transitionState(rigWs, ClientState.CLOSING);
    rigWs.close(1008, "Handshake timeout");
  }, 5000);

  rigWs.on("error", console.error);

  rigWs.on("message", (message) => {
    rigWs.lastActivity = Date.now();
    try {
      const msg: ClientMessage = JSON.parse(message.toString());

      if (!msg.messageType) {
        sendMessage(rigWs, "ERROR", undefined, {
          code: "INVALID_MESSAGE",
          message: "messageType missing",
        });
        return;
      }

      if (
        rigWs.state === ClientState.HANDSHAKING &&
        msg.messageType !== "HANDSHAKE"
      ) {
        // Enforce protocol contract — first message must be HANDSHAKE
        console.warn(
          `[PROTOCOL VIOLATION] Client sent ${msg.messageType} during HANDSHAKING`,
        );

        transitionState(rigWs, ClientState.CLOSING);

        if (rigWs.readyState === WebSocket.OPEN) {
          rigWs.close(1002, "Expected HANDSHAKE as the first message");
        }
        clearTimeout(handshakeTimer);
        return;
      }

      dispatchMessage(rigWs, msg);
    } catch (error) {
      console.error("Invalid JSON Handshake", error);
      transitionState(rigWs, ClientState.CLOSING);
      rigWs.close(1002, "Invalid handshake schema");

      clearTimeout(handshakeTimer);
    }
  });

  rigWs.on("pong", () => heartbeat(rigWs));
  rigWs.on("close", () => {
    clearTimeout(handshakeTimer);
    transitionState(rigWs, ClientState.CLOSED);
    console.log(`Client disconnected. Final State: ${rigWs.state}`);
  });
});

// =============================================================================
// Background Jobs
// =============================================================================

const interval = setInterval(function ping() {
  const now = Date.now();

  wss.clients.forEach(function each(ws: WebSocket) {
    const rigClient = ws as RigWebSocket;

    if (rigClient.isAlive === false) {
      transitionState(rigClient, ClientState.CLOSING);
      return rigClient.terminate();
    }

    rigClient.isAlive = false;

    if (
      rigClient.state === ClientState.ACTIVE &&
      now - rigClient.lastActivity > IDLE_TIMEOUT_MS
    ) {
      // Automatically downgrade inactive clients to reduce broadcast load
      transitionState(rigClient, ClientState.IDLE);
      console.log("Client masuk ke mode IDLE karena tidak ada aktivitas.");
    }

    if (rigClient.readyState === WebSocket.OPEN) {
      rigClient.ping();
    }
  });
}, 5000);

let tick = 0;

setInterval(() => {
  try {
    rigState.timestamp = BigInt(Date.now());
    rigState.depth += 0.01;

    rigState.rpm = getRandom(115, 125);
    rigState.wob = getRandom(18, 22);
    rigState.torque = getRandom(4, 6);
    rigState.spp = getRandom(2450, 2550);
    rigState.hkld = getRandom(190, 210);

    sendDrillBuff();

    if (tick % 10 === 0) {
      rigState.gamma = getRandom(40, 60);
      rigState.gas = getRandom(5, 15);

      sendGeoBuff();
    }

    // Simulate rare critical condition for testing alarm lifecycle
    mockAlarmGenerator();

    tick++;
  } catch (error) {
    console.error("Critical Tick Error", error);
  }
}, 100);

wss.on("close", function close() {
  clearInterval(interval);
});
