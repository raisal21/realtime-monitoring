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

interface RigWebSocket extends WebSocket {
  state: ClientState;
  isAlive: boolean;
  lastActivity: number;
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
// Header (8) + Time (8) + Depth (4) + Sensor (5x4 = 20) = 40 Byte
const drillBuff = new ArrayBuffer(40);
const drillView = new DataView(drillBuff);

const geoBuff = new ArrayBuffer(40);
const geoView = new DataView(geoBuff);

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

function broadcast(buffer: ArrayBuffer) {
  wss.clients.forEach((client) => {
    const rigClient = client as RigWebSocket;
    if (
      rigClient.readyState === WebSocket.OPEN &&
      rigClient.state === ClientState.ACTIVE
    ) {
      rigClient.send(buffer);
    }
  });
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

  broadcast(drillBuff);
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

  broadcast(geoBuff);
}

let tick = 0;

wss.on("connection", (ws: WebSocket) => {
  const rigWs = ws as RigWebSocket;

  rigWs.state = ClientState.CONNECTING;
  rigWs.isAlive = true;
  rigWs.lastActivity = Date.now();

  console.log("Client connected. Waiting for handshake");

  transitionState(rigWs, ClientState.HANDSHAKING);

  const handshakeTimer = setTimeout(() => {
    transitionState(rigWs, ClientState.CLOSING);
    rigWs.close(1008, "Handshake timeout");
  }, 5000);

  rigWs.on("error", console.error);

  rigWs.on("message", (message) => {
    rigWs.lastActivity = Date.now();
    if (rigWs.state !== ClientState.HANDSHAKING) return;
    try {
      const data = JSON.parse(message.toString());

      // Validate handshake
      if (data.messageType === "HANDSHAKE" && data.schemaId === 1) {
        transitionState(rigWs, ClientState.ACTIVE);
        rigWs.send(
          JSON.stringify({
            messagetype: "HANDSHAKE",
            status: "OK",
            streams: [101, 102],
          }),
        );

        console.log("Client Handshaked!");
        clearTimeout(handshakeTimer);
      } else {
        transitionState(rigWs, ClientState.CLOSING);
        rigWs.close(1002, "Invalid handshake schema");

        clearTimeout(handshakeTimer);
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
    tick++;
  } catch (error) {
    console.error("Critical Tick Error", error);
  }
}, 100);

wss.on("close", function close() {
  clearInterval(interval);
});
