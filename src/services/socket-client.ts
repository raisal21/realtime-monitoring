import type { handshake } from "../domain/drilingSchema"
import { handshakeSchema } from "../domain/drilingSchema"
import * as z from "zod"

const rawData:handshake = {
    messageType: 'HANSHAKE',
    schemaId: 1
}

 const socket = new WebSocket("ws://localhost:8080")

const sendHandshake = (ws: WebSocket, data: handshake) => ({
    const payload = JSON.stringify(data);
    ws.send(payload)
})

