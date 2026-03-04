import { useEffect, useRef } from "react";
import { createRigClient, connect } from "./services/socket-client";

export default function App() {
  const clientRef = useRef(createRigClient());

  useEffect(() => {
    async function start() {
      try {
        const { readable } = await connect(clientRef.current);
        console.log("Connected!");

        const reader = readable.getReader();

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
