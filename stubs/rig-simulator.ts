import { setInterval } from "node:timers";
import { WebSocket, WebSocketServer } from "ws";

interface RigWebSocket extends WebSocket {
  isHandshake: boolean;
}
const wss = new WebSocketServer({ port: 8080 });

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

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function broadcast(buffer: ArrayBuffer) {
  wss.clients.forEach((client) => {
    const rigClient = client as RigWebSocket;
    if (rigClient.readyState === WebSocket.OPEN && rigClient.isHandshake) {
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
  rigWs.isHandshake = false;

  console.log("Client connected. Waiting for handshake");

  rigWs.on("error", console.error);

  rigWs.on("message", (message) => {
    if (rigWs.isHandshake) return;

    try {
      const data = JSON.parse(message.toString());

      // Validate handshake
      if (data.messageType === "HANDSHAKE" && data.schemaId === 1) {
        rigWs.isHandshake = true;

        rigWs.send(
          JSON.stringify({
            messagetype: "HANDSHAKE",
            status: "OK",
            streams: [101, 102],
          }),
        );
        console.log("Client Handshaked!");
      } else {
        rigWs.close();
      }
    } catch (error) {
      console.error("Invalid JSON Handshake", error);
      rigWs.close();
    }
  });
});

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
