// App.tsx

import * as z from "zod";
import { useEffect, useRef } from "react";
import {
  createRigClient,
  connect,
  ClientState,
  transitionState,
} from "./services/rig-client.ts";
import { ServerSchema } from "./domain/message.schema.ts";
import { handleWelcome, handleSubscribeAck } from "./services/protocol";
import { log } from "./utils/logger.ts";
import {
  SUPPORTED_SCHEMA_ID,
  PROTOCOL_VERSION,
  StreamDef,
} from "./domain/constants.ts";

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
              protocolVersion: PROTOCOL_VERSION,
              schemaId: SUPPORTED_SCHEMA_ID,
              clientId: crypto.randomUUID(),
            },
          }),
        );

        const { value: welcomeValue } = await reader.read();
        const welcomeMsg = ServerSchema.safeParse(welcomeValue);

        if (!welcomeMsg.success) {
          const err = z.prettifyError(welcomeMsg.error);
          log.warn("[PROTOCOL] Invalid WELCOME:", err);
          return;
        }

        const welcome = handleWelcome(welcomeMsg.data);
        transitionState(clientRef.current, ClientState.ACTIVE);

        const streamsToSubscribe = Object.values(StreamDef).filter((id) =>
          welcome.availableStreams.includes(id),
        );

        if (streamsToSubscribe.length === 0) {
          log.warn("[PROTOCOL] No supported streams available from server");
          return;
        }

        await writer.write(
          JSON.stringify({
            messageType: "SUBSCRIBE",
            payload: {
              streams: streamsToSubscribe,
            },
          }),
        );

        const { value: subValue } = await reader.read();
        const subscribeAck = ServerSchema.safeParse(subValue);

        if (!subscribeAck.success) {
          const err = z.prettifyError(subscribeAck.error);
          log.warn("[PROTOCOL] Invalid SUBSCRIBE_ACK:", err);
          return;
        }

        const subsAck = handleSubscribeAck(subscribeAck.data);
        transitionState(clientRef.current, ClientState.ACTIVE);

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
