import { Aedes } from "aedes";
import { createServer as createHttpServer } from "http";
import { createServer as createNetServer } from "net";
import { WebSocketServer, createWebSocketStream } from "ws";

// ============================================================
// 1. CONFIGURATION & TYPES
// ============================================================
const WS_PORT = 8888; // Port untuk Browser (WebSocketStream)
const TCP_PORT = 1883; // Port untuk MQTT Explorer (Debug)

// Interface untuk payload Heartbeat agar Type-Safe
interface HeartbeatPayload {
  timestamp: number;
  status: "LIVE" | "MAINTENANCE" | "OFFLINE";
  uptime: number;
}

// ============================================================
// 2. SETUP BROKER (AEDES)
// ============================================================
const aedes = new Aedes();

// --- A. TCP Server (Untuk MQTT Explorer via TCP) ---
const tcpServer = createNetServer(aedes.handle);

tcpServer.on("error", (err) => {
  console.error("❌ TCP Server Error:", err.message);
  process.exit(1); // Matikan proses jika port tabrakan
});

// LISTEN KE 0.0.0.0 (PENTING!)
tcpServer.listen(TCP_PORT, "0.0.0.0", () => {
  console.log(`📡  MQTT TCP Server running on port: ${TCP_PORT}`);
  console.log(`    -> Connect via: mqtt://localhost:${TCP_PORT}`);
});

// --- B. WebSocket Server (Untuk Browser & MQTT Explorer via WS) ---
const httpServer = createHttpServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (conn, req) => {
  console.log(`🔌  New WebSocket connection attempt...`);
  const stream = createWebSocketStream(conn as any);
  aedes.handle(stream as any, req);
});

httpServer.on("error", (err) => {
  console.error("❌ HTTP/WS Server Error:", err.message);
  process.exit(1);
});

// LISTEN KE 0.0.0.0 (PENTING!)
httpServer.listen(WS_PORT, "0.0.0.0", () => {
  console.log(`🌍  MQTT WebSocket Server running on port: ${WS_PORT}`);
  console.log(`    -> Connect via: ws://localhost:${WS_PORT}`);
});
// ============================================================
// 3. EVENT LISTENERS (DEBUGGING)
// ============================================================
aedes.on("client", (client) => {
  console.log(`✅ Client Connected: ${client ? client.id : "Unknown"}`);
});

aedes.on("clientDisconnect", (client) => {
  console.log(`👋 Client Disconnected: ${client ? client.id : "Unknown"}`);
});

aedes.on("clientError", (client, err) => {
  console.error(
    `⚠️ Client Error (${client ? client.id : "Unknown"}):`,
    err.message,
  );
});

aedes.on("connectionError", (client, err) => {
  console.error(`⚠️ Connection Error:`, err.message);
});

// ============================================================
// 4. HEARTBEAT LOOP
// ============================================================
setInterval(() => {
  const payload = {
    timestamp: Date.now(),
    status: "LIVE",
    msg: "Server is running",
  };

  aedes.publish(
    {
      cmd: "publish",
      qos: 0,
      dup: false,
      retain: false,
      topic: "system/heartbeat",
      payload: Buffer.from(JSON.stringify(payload)),
    },
    (err) => {
      if (err) console.error("❌ Failed to publish heartbeat:", err);
    },
  );
}, 5000);

console.log("🚀 WITSML Mock Server (Phase 1) is ready!");
