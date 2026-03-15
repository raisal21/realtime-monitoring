// protocol.ts

import { log } from "../utils/logger";
import type {
  ServerMessage,
  WelcomeMessage,
  SubsAckMessage,
} from "../domain/message.types.ts";

export function handleWelcome(msg: ServerMessage): WelcomeMessage | null {
  if (msg.messageType !== "WELCOME") {
    throw new Error(`[PROTOCOL] Expected WELCOME, got: ${msg.messageType}`);
  }

  if (!("payload" in msg)) {
    throw new Error(`[PROTOCOL] WELCOME returned error:", ${msg.error}`);
  }

  log.debug("[PROTOCOL] WELCOME validated");
  return msg.payload;
}

export function handleSubscribeAck(msg: ServerMessage): SubsAckMessage | null {
  if (msg.messageType !== "SUBSCRIBE_ACK") {
    throw new Error(
      `[PROTOCOL] Expected SUBSCRIBE_ACK, got:, ${msg.messageType}`,
    );
  }

  if (!("payload" in msg)) {
    throw new Error(`[PROTOCOL] SUBSCRIBE_ACK returned error:, ${msg.error}`);
  }

  log.debug("[PROTOCOL] SUBSCRIBE_ACK validated");
  return msg.payload;
}
