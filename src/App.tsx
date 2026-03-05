import { useEffect, useRef } from "react";
import {
  createRigClient,
  connect,
  ClientState,
} from "./services/socket-client";
import { transitionState } from "./services/socket-client";

export default function App() {
  const clientRef = useRef(createRigClient());

  useEffect(() => {
    async function start() {
      try {
        const { readable, writable } = await connect(clientRef.current);

        const reader = readable.getReader();
        const writer = writable.getWriter();

        await writer.write(
          JSON.stringify({
            messageType: "HANDSHAKE",
            payload: {
              protocolVersion: 1,
              schemaId: 1,
              clientId: crypto.randomUUID(),
            },
          }),
        );

        writer.releaseLock();

        const { value: welcomeValue } = await reader.read();
        const welcomeMsg = JSON.parse(welcomeValue);

        if (welcomeMsg.messageType !== "WELCOME") {
          throw new Error("Handshake rejected");
        }

        console.log("Server Ack:", welcomeMsg);

        transitionState(clientRef.current, ClientState.ACTIVE);

        await writer.write(
          JSON.stringify({
            messageType: "SUBSCRIBE",
            payload: {
              streams: [101, 102],
            },
          }),
        );

        const { value: subValue } = await reader.read();
        const subscribeAck = JSON.parse(subValue);

        if (subscribeAck.messageType !== "SUBSCRIBE_ACK") {
          throw new Error("Subscribe rejected");
        }

        console.log("Subscribe Ack:", subscribeAck);

        writer.releaseLock();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          console.log("Received:", value);
        }
      } catch (err) {
        console.error("Connection failed:", err);
      }
    }

    start();
  }, []);

  return <div>Rig Dashboard</div>;
}
