const wsURL = "ws://localhost:8888";
const logElement = document.getElementById("log")!;
const statusElement = document.getElementById("status")!;

function appendLog(msg: string) {
  const div = document.createElement("div");
  div.textContent = `> ${msg}`;
  logElement.appendChild(div);
  logElement.scrollTop = logElement.scrollHeight;
}

// 1. Cek dukungan API dulu sebelum membuat instance
if (!("WebSocketStream" in window)) {
  statusElement.innerHTML =
    '<b class="error">Browser tidak mendukung WebSocketStream!</b>';
  console.error("Gunakan Chrome atau Edge versi terbaru.");
} else {
  statusElement.innerText = "Connecting to WebSocket...";

  async function start() {
    try {
      // 2. Buat instance WebSocketStream
      const socket = new WebSocketStream(wsURL, {
        protocols: ["mqtt"], // MQTT biasanya butuh array atau string
        signal: AbortSignal.timeout(5000),
      });

      const { readable } = await socket.opened;
      statusElement.innerText = "Connected! Receiving data...";

      const reader = readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          appendLog("Stream closed.");
          break;
        }
        appendLog(`Message: ${value}`);
      }
    } catch (err) {
      statusElement.innerHTML = `<b class="error">Error: ${err}</b>`;
      console.error(err);
    }
  }

  start();
}
