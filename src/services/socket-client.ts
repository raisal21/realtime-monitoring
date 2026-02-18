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
  const controller = new AbortController();
  const wsURL = "ws://localhost:8888";
  const socket = new WebSocketStream(wsURL, {
    protocols: "mqtt",
    signal: AbortSignal.timeout(5000),
  });

  async function start() {
    const { readable, writable } = await socket.opened;
    writeToScreen("CONNECTED");
    closeBtn.disabled = false;

    const reader = readable.getReader();
    const writer = writable.getWriter();

    writer.write("ping");
    writeToScreen("SENT: ping");

    while (true) {
      const { value, done } = reader.read();
      if (done) {
        break;
      }
    }

    setTimeout(async () => {
      try {
        await writer.write("ping");
        writeToScreen("SENT: ping");
      } catch (e) {
        writeToScreen(`Error Writing to Socket: ${e.message}`);
      }
    });
  }

  start();

  closeBtn?.addEventListener("click", () => {
    socket.close({
      closeCode: 1000,
      reason: "That's all folks",
    });
  });

  closeBtn.disabled = true;
} else {
  writeToScreen("Browser does not support");
  console.log("Browser does not support");
}
