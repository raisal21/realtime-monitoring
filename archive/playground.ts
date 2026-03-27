enum StreamDef {
  DRILL = 101,
  GEO = 102,
}

interface RigWebSocket extends WebSocket {
  state: ClientState;
  isAlive: boolean;
  lastActivity: number;
  subscribe: Set<StreamDef>;
}

const subsSet = new Set<number>
const subsId = []

const data = JSON.parse(message.toString());

function broadcast(buffer: ArrayBuffer) {
  wss.clients.forEach((client) => {
    const rigClient = client as RigWebSocket;
    if (
      rigClient.readyState === WebSocket.OPEN &&
      rigClient.state === ClientState.ACTIVE
    ) {
rigClient.subscribe.add(id)
      rigClient.send(buffer);
    }
  });
}

if (data.messageType === "SUBSCRIBE" && rigWS.subscribe.has(data.streams)) {
        rigWs.send(
          JSON.stringify({
            messagetype: "SUBSCRIBE",
            requestId: "uuid"
            accepted : [101, 102],
          }),
}
