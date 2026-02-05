import { RawData, WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
    ws.on('error', console.error);

    ws.on('message', (data: RawData) => {
        console.log('received: %s', data);
    });

    ws.send('something');
})
