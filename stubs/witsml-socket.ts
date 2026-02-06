import { WebSocket, WebSocketServer } from "ws";
import { generatePhysicsBatch } from "./mock-data";

let packetCounter = 0;
const BATCH_SIZE = 50;

const { timeBuf, depthBuf, wobBuf, rpmBuf, trqBuf, hkldBuf, sppBuf } =
  generatePhysicsBatch();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", console.error);

  const buffer = new ArrayBuffer(1410);

  const headerView = new DataView(buffer, 0, 8);

  headerView.setUint8(0, 101);
  headerView.setUint8(1, 50);

  headerView.setUint8(4, packetCounter++);

  const timeView = new BigUint64Array(buffer, 8, BATCH_SIZE);
  const depthView = new Float32Array(buffer, 408, BATCH_SIZE);
  const wobView = new Float32Array(buffer, 608, BATCH_SIZE);
  const rpmView = new Float32Array(buffer, 808, BATCH_SIZE);
  const torqView = new Float32Array(buffer, 1008, BATCH_SIZE);
  const hkldView = new Float32Array(buffer, 1208, BATCH_SIZE);
  const sppView = new Float32Array(buffer, 1408, BATCH_SIZE);

  timeView.set(timeBuf);
  depthView.set(depthBuf);
  wobView.set(wobBuf);
  rpmView.set(rpmBuf);
  torqView.set(trqBuf);
  hkldView.set(hkldBuf);
  sppView.set(sppBuf);

  ws.send(buffer);
});
