import { Aedes } from "aedes";
import { createServer as createHttpServer } from "http";
import { createServer as createNetServer } from "net";
import { WebSocketServer, createWebSocketStream } from "ws";

// ============================================================
// CONFIGURATION & TYPES
// ============================================================
const WS_PORT = 8888;
const TCP_PORT = 1883;

interface HeartbeatPayload {
  timestamp: number;
  status: "LIVE" | "MAINTENANCE" | "OFFLINE";
  uptime: number;
}

interface AlarmPayload {
  id: string;
  code: string;
  message: string;
  severity: "WARNING" | "CRITICAL";
  timestamp: number;
  status: "NEW" | "ACKNOWLEDGED";
}

interface AckPayload {
  alarmId: string;
  operator: string;
  timestamp: number;
}
// ============================================================
// STATE & MEMORY
// ============================================================

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
let tick = 0;

const alarmMessages = [
  { code: "WITSML-01", msg: "High Torque Detected", sev: "WARNING" },
  { code: "WITSML-02", msg: "Mud Loss (Pit Volume)", sev: "CRITICAL" },
  { code: "WITSML-03", msg: "H2S Gas Detect > 10ppm", sev: "CRITICAL" },
  { code: "WITSML-04", msg: "Pump Pressure Low", sev: "WARNING" },
];

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

(async () => {
  // ============================================================
  // SETUP BROKER (AEDES)
  // ============================================================
  const aedes = await Aedes.createBroker();

  const tcpServer = createNetServer(aedes.handle);

  tcpServer.on("error", (err) => {
    console.error("❌ TCP Server Error:", err.message);
    process.exit(1);
  });

  tcpServer.listen(TCP_PORT, "0.0.0.0", () => {
    console.log(`📡  MQTT TCP Server running on port: ${TCP_PORT}`);
  });

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

  httpServer.listen(WS_PORT, "0.0.0.0", () => {
    console.log(`🌍  MQTT WebSocket Server running on port: ${WS_PORT}`);
  });
  // ============================================================
  // EVENT LISTENERS (DEBUGGING)
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

  aedes.on("subscribe", (subscriptions, client) => {
    subscriptions.forEach((sub) =>
      console.log(`[SUB] ${client.id} -> ${sub.topic}`),
    );
  });

  // ============================================================
  //  INTERVAL LOOP
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

  setInterval(() => {
    try {
      rigState.timestamp = BigInt(Date.now());
      rigState.depth += 0.01;
      rigState.rpm = getRandom(115, 125);
      rigState.wob = getRandom(18, 22);
      rigState.torque = getRandom(4, 6);
      rigState.spp = getRandom(2450, 2550);
      rigState.hkld = getRandom(190, 210);

      drillView.setUint8(0, 101); // ID
      drillView.setUint8(1, 1); // Version
      drillView.setUint32(4, seqDrill++); // Sequence
      drillView.setBigUint64(8, rigState.timestamp);
      drillView.setFloat32(16, rigState.depth);
      drillView.setFloat32(20, rigState.rpm);
      drillView.setFloat32(24, rigState.wob);
      drillView.setFloat32(28, rigState.torque);
      drillView.setFloat32(32, rigState.hkld);
      drillView.setFloat32(36, rigState.spp);

      // PUBLISH DRILL BUFFER 🚀
      aedes.publish(
        {
          cmd: "publish",
          qos: 0,
          dup: false,
          retain: false,
          topic: "sensor/drilling/raw",
          payload: Buffer.from(drillBuff),
        },
        (err) => {
          if (err) console.error(err);
        },
      );

      if (tick % 10 === 0) {
        rigState.gamma = getRandom(40, 60);
        rigState.gas = getRandom(5, 15);

        geoView.setUint8(0, 102); // ID
        geoView.setUint8(1, 1); // Version
        geoView.setUint32(4, seqGeo++);
        geoView.setBigUint64(8, rigState.timestamp);
        geoView.setFloat32(16, rigState.depth);
        geoView.setFloat32(20, rigState.gamma);
        geoView.setFloat32(24, rigState.rop);
        geoView.setFloat32(28, rigState.gas);
        geoView.setFloat32(32, rigState.inc);
        geoView.setFloat32(36, rigState.azi);

        aedes.publish(
          {
            cmd: "publish",
            qos: 0,
            dup: false,
            retain: false,
            topic: "sensor/geo/raw",
            payload: Buffer.from(geoBuff),
          },
          (err) => {
            if (err) console.error(err);
          },
        );
      }

      tick++;
    } catch (error) {
      console.error("Critical Simulation Error", error);
    }
  }, 100);

  setInterval(() => {
    if (Math.random() > 0.7) {
      const randomAlarm =
        alarmMessages[Math.floor(Math.random() * alarmMessages.length)];

      const alarmData: AlarmPayload = {
        id: `ALM-${Date.now()}`, // ID Unik
        code: randomAlarm.code,
        message: randomAlarm.msg,
        severity: randomAlarm.sev as "WARNING" | "CRITICAL",
        timestamp: Date.now(),
        status: "NEW",
      };

      console.log(`🚨 Generating Alarm: ${alarmData.code}`);

      aedes.publish(
        {
          cmd: "publish",
          qos: 1, // QoS 1: Wajib sampai (Penting!)
          topic: "alarms/new",
          payload: Buffer.from(JSON.stringify(alarmData)),
          retain: false,
        },
        (err) => {
          if (err) console.error(err);
        },
      );
    }
  }, 15000); // Cek tiap 15 detik

  aedes.on("publish", (packet, client) => {
    if (client && packet.topic === "alarms/ack") {
      try {
        const ackData = JSON.parse(packet.payload.toString()) as AckPayload;

        console.log(
          `👮 User [${ackData.operator}] ACKNOWLEDGED Alarm [${ackData.alarmId}]`,
        );

        const syncPayload = {
          alarmId: ackData.alarmId,
          status: "ACKNOWLEDGED",
          by: ackData.operator,
          at: Date.now(),
        };

        aedes.publish(
          {
            cmd: "publish",
            qos: 1,
            topic: "alarms/sync",
            payload: Buffer.from(JSON.stringify(syncPayload)),
            retain: false,
          },
          (err) => {
            if (err) console.error(err);
          },
        );
      } catch (error) {
        console.error("❌ Invalid ACK Payload:", error);
      }
    }
  });
})();
