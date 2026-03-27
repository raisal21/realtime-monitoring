// App.tsx

import { useEffect, useRef } from "react";
import {
  createConnectionManager,
  ConnectionStatus,
} from "./services/connection-manager";
import { log } from "./utils/logger";
import type { ServerMessage } from "./domain/message.types";

export default function App() {
  const managerRef = useRef(
    createConnectionManager({
      onMessage(msg: ServerMessage) {
        log.debug(`[APP] Message received: ${JSON.stringify(msg)}`);
      },
      onStatusChange(status: ConnectionStatus) {
        log.info(`[APP] Connection status → ${status}`);
      },
    }),
  );

  useEffect(() => {
    const manager = managerRef.current;
    manager.start();

    return () => {
      manager.stop();
    };
  }, []);

  return <div>Rig Dashboard</div>;
}
