// App.tsx

// import { useEffect, useRef } from "react";
// import { useStore } from "zustand";
// import { createConnectionManager } from "./services/connection-manager";
// import type { ConnectionStatus } from "./domain/message.types";
// import { log } from "./utils/logger";
// import type { ServerMessage } from "./domain/message.types";
// import { globalRigStore } from "./store/index-store";
// import Dashboard from "./pages/Dashboard";
// import Auth from "./pages/Auth";
import WellExplorer from "./pages/WellExplorer";

export default function App() {
  // const status = useStore(globalRigStore, (s) => s.status);
  // const alarms = useStore(globalRigStore, (s) => s.alarmRegistry);
  // const drillTelemetry = useStore(globalRigStore, (s) => s.drillStream);
  // const geoTelemetry = useStore(globalRigStore, (s) => s.geoStream);
  // const triggerRetry = useStore(globalRigStore, (s) => s.triggerRetry);

  // const managerRef = useRef(
  //   createConnectionManager({
  //     onMessage(msg: ServerMessage) {
  //       log.debug(`[APP] Message received: ${JSON.stringify(msg)}`);
  //     },
  //     onStatusChange(status: ConnectionStatus) {
  //       log.info(`[APP] Connection status → ${status}`);
  //     },
  //   }),
  // );

  // useEffect(() => {
  //   const manager = managerRef.current;
  //   globalRigStore.getState().setSender(manager.send);
  //   globalRigStore.getState().setRetrier(manager.retry);
  //   manager.start();

  //   return () => {
  //     manager.stop();
  // globalRigStore.getState().setSender(() => {});
  // globalRigStore.getState().setRetrier(() => {});
  //   };
  // }, []);

  return (
    <>
      {/* 
    <p>Status: {status}</p> 
    <p>Alarms: {alarms.size}</p> 
    <p>Drill telemetry points: {drillTelemetry.length}</p> 
    <p>Geo telemetry points: {geoTelemetry.length}</p>

    {status === "ERROR" && <button onClick={triggerRetry}>Reconnect</button>} 
    */}
      <WellExplorer />
    </>
  );
}
