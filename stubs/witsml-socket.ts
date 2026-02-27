import { setInterval } from "node:timers";
import { WebSocket, WebSocketServer } from "ws";

enum ClientState {
  CONNECTING = "CONNECTING",
  HANDSHAKING = "HANDSHAKING",
  // READY = "READY",
  ACTIVE = "ACTIVE",
  IDLE = "IDLE",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
}

enum StreamDef {
  DRILL = 101,
  GEO = 102,
}

const ValidTransitions: Record<ClientState, ClientState[]> = {
  [ClientState.CONNECTING]: [ClientState.HANDSHAKING, ClientState.CLOSING],
  [ClientState.HANDSHAKING]: [
    // ClientState.READY,
    ClientState.CLOSED,
  ],
  // [ClientState.READY]: [
  //   ClientState.ACTIVE,
  //   ClientState.CLOSING,
  //   ClientState.CLOSED,
  // ],
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

enum AlarmSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

interface AlarmAcknowledgement {
  operatorName: string;
  role: string;
  timestamp: number;
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

interface RigWebSocket extends WebSocket {
  state: ClientState;
  isAlive: boolean;
  lastActivity: number;
  subscriptions: Set<StreamDef>;
  slowSince?: number;
  droppedFrames: number;
}

const wss = new WebSocketServer({ port: 8080 });

function transitionState(client: RigWebSocket, nextState: ClientState) {
  if (client.state === ClientState.CLOSED) return;

  const allowed = ValidTransitions[client.state] || [];
  if (allowed.includes(nextState)) {
    client.state = nextState;
  } else {
    console.warn(
      `[STATE ERROR] Ilegal transisi: ${client.state} -> ${nextState}`,
    );
  }
}

// --- Memory & State ---
const MAX_BUFFER = 2 * 1024 * 1024;
const SLOW_TIMEOUT = 5000;

// Header (8) + Time (8) + Depth (4) + Sensor (5x4 = 20) = 40 Bytek
const drillBuff = new ArrayBuffer(40);
const drillView = new DataView(drillBuff);

const geoBuff = new ArrayBuffer(40);
const geoView = new DataView(geoBuff);

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

const IDLE_TIMEOUT_MS = 15000;

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

function raiseAlarm(code: string, message: string, severity: AlarmSeverity) {
  if (activeAlarmCodes.has(code)) return;

  let id = `ALM-${alarmSequence++}`;
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

  activeAlarms.set(id, alarm);
  activeAlarmCodes.add(code);

  broadcastAlarmRaised(alarm);
}

function broadcastAlarmRaised(alarm: Alarm) {
  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;

    if (rigClient.state !== ClientState.ACTIVE) continue;

    rigClient.send(
      JSON.stringify({
        messageType: "ALARM_RAISED",
        payload: { alarm },
      }),
    );
  }
}

function broadcast(buffer: ArrayBuffer, streamId: StreamDef) {
  const now = Date.now();

  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;

    if (rigClient.readyState !== WebSocket.OPEN) continue;
    if (rigClient.state !== ClientState.ACTIVE) continue;
    if (!rigClient.subscriptions.has(streamId)) continue;
    if (rigClient.bufferedAmount > MAX_BUFFER) {
      rigClient.droppedFrames++;

      if (!rigClient.slowSince) {
        rigClient.slowSince = now;
      }

      if (now - rigClient.slowSince > SLOW_TIMEOUT) {
        console.warn("Disconnecting slow client");

        transitionState(rigClient, ClientState.CLOSING);
        rigClient.close(1009, "Client too slow");
      }

      return;
    }

    rigClient.slowSince = undefined;

    rigClient.send(buffer);
  }
}

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

function sendMessage(
  ws: RigWebSocket,
  messageType: string,
  payload?: Record<string, any>,
  error?: { code: string; message: string },
) {
  if (ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      messageType,
      timestamp: Date.now(),
      ...(payload && { payload }),
      ...(error && { error }),
    }),
  );
}

function handleHandshake(
  rigWs: RigWebSocket,
  data: any,
  handshakeTimer: NodeJS.Timeout,
) {
  if (rigWs.state !== ClientState.HANDSHAKING) return;

  if (typeof data.schemaId !== "number") {
    sendMessage(rigWs, "HANDSHAKE_ACK", undefined, {
      code: "INVALID_SCHEMA",
      message: "schemaId must be a number",
    });
    return;
  }

  if (data.schemaId !== 1) {
    transitionState(rigWs, ClientState.CLOSING);

    sendMessage(rigWs, "HANDSHAKE_ACK", undefined, {
      code: "UNSUPPORTED_SCHEMA",
      message: "Unsupported schemaId",
    });

    rigWs.close(1002, "Unsupported schema");
    clearTimeout(handshakeTimer);
    return;
  }

  transitionState(rigWs, ClientState.ACTIVE);

  sendMessage(rigWs, "HANDSHAKE_ACK", {
    status: "OK",
    availableStreams: Object.values(StreamDef),
  });

  console.log("Client Handshaked!");

  clearTimeout(handshakeTimer);
}

function handleSubscribe(rigWs: RigWebSocket, data: any) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to subscribe",
    });
    return;
  }

  if (!Array.isArray(data.streams)) {
    sendMessage(rigWs, "SUBSCRIBE_ACK", undefined, {
      code: "INVALID_PAYLOAD",
      message: "streams must be an array",
    });
    return;
  }

  const accepted: StreamDef[] = [];
  const rejected: number[] = [];

  for (const id of data.streams) {
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

function handleUnsubscribe(rigWs: RigWebSocket, data: any) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to unsubscribe",
    });
    return;
  }

  if (!Array.isArray(data.streams)) {
    sendMessage(rigWs, "UNSUBSCRIBE_ACK", undefined, {
      code: "INVALID_PAYLOAD",
      message: "streams must be an array",
    });
    return;
  }

  const removed: StreamDef[] = [];
  const notFound: number[] = [];

  for (const id of data.streams) {
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

function handleUnknownMessage(rigWs: RigWebSocket, data: any) {
  console.warn(`[PROTOCOL WARNING] Unknown message:`, data);

  sendMessage(rigWs, "ERROR", undefined, {
    code: "UNKNOWN_MESSAGE_TYPE",
    message: `Unsupported messageType: ${data.messageType ?? "undefined"}`,
  });
}

function handleAlarmAck(rigWs: RigWebSocket, data: any) {
  if (![ClientState.ACTIVE, ClientState.IDLE].includes(rigWs.state)) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_STATE",
      message: "Client must be ACTIVE or IDLE to unsubscribe",
    });
  }

  if (!data.payload) {
    sendMessage(rigWs, "ERROR", undefined, {
      code: "INVALID_PAYLOAD",
      message: "Missing payload",
    });
    return;
  }

  const { alarmId, operatorName, role } = data.payload;

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

  activeAlarmCodes.delete(alarm.code);

  broadcastAlarmAcked(alarm);
}

function broadcastAlarmAcked(alarm: Alarm) {
  for (const client of wss.clients) {
    const rigClient = client as RigWebSocket;
    if (rigClient.state !== ClientState.ACTIVE) continue;

    rigClient.send(
      JSON.stringify({
        messageType: "ALARM_ACKED",
        payload: { alarm },
      }),
    );
  }
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

let tick = 0;

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
      const data = JSON.parse(message.toString());

      if (
        rigWs.state === ClientState.HANDSHAKING &&
        data.messageType !== "HANDSHAKE"
      ) {
        console.warn(
          `[PROTOCOL VIOLATION] Client sent ${data.messageType} during HANDSHAKING`,
        );
        transitionState(rigWs, ClientState.CLOSING);
        if (rigWs.readyState === WebSocket.OPEN) {
          rigWs.close(1002, "Expected HANDSHAKE as the first message");
        }
        clearTimeout(handshakeTimer);
        return;
      }

      switch (data.messageType) {
        case "HANDSHAKE":
          handleHandshake(rigWs, data, handshakeTimer);
          break;
        case "SUBSCRIBE":
          handleSubscribe(rigWs, data);
          break;
        case "UNSUBSCRIBE":
          handleUnsubscribe(rigWs, data);
          break;
        case "ALARM_ACKED":
          handleAlarmAck(rigWs, data);
          break;
        default:
          handleUnknownMessage(rigWs, data);
          break;
      }
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
      transitionState(rigClient, ClientState.IDLE);
      console.log("Client masuk ke mode IDLE karena tidak ada aktivitas.");
    }

    if (rigClient.readyState === WebSocket.OPEN) {
      rigClient.ping();
    }
  });
}, 5000);

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

    mockAlarmGenerator();

    tick++;
  } catch (error) {
    console.error("Critical Tick Error", error);
  }
}, 100);

wss.on("close", function close() {
  clearInterval(interval);
});
