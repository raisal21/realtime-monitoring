// import type { handshake } from "../domain/drilingSchema"
// import { handshakeSchema } from "../domain/drilingSchema"
// import * as z from "zod"
//
// const rawData:handshake = {
//     messageType: 'HANSHAKE',
//     schemaId: 1
// }
//
//  const socket = new WebSocket("ws://localhost:8080")
//
// const sendHandshake = (ws: WebSocket, data: handshake) => ({
//     const payload = JSON.stringify(data);
//     ws.send(payload)
// })
//

const output = document.querySelector("#output");
const closeBtn = document.querySelector("#close");

function writeToScreen(message) {
  const pElem = document.createElement("p");
  pElem.textContent = message;
  output.appendChild(pElem);
}

if ("WebSocketStream" in self) {
  console.log("Browser does not support");
} else {
  const socket = new WebSocketStream("ws://localhost:8888", {
    protocols: "mqtt",
    signal: AbortSignal.timeout(5000),
  });
}
