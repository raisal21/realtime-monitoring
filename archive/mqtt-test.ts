import { createServer } from "node:net";
import { Aedes } from "aedes";

const port = 1883;

(async () => {
  const aedes = await Aedes.createBroker();
  const server = createServer(aedes.handle);

  server.listen(port, () => {
    console.log("MQTT server started on", port);
  });
})();
