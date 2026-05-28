// services/protocol.ts

import { log } from "@/utils/logger";
import type {
  ServerMessage,
  WelcomeMessage,
  SubsAckMessage,
  UnsubsAckMessage,
  TileSubscribeAckMessage,
  TileUnsubscribeAckMessage,
  ClosingMessage,
} from "@/domain/message.types";

export function handleWelcome(
  msg: Extract<ServerMessage, { messageType: "WELCOME" }>,
): WelcomeMessage {
  log.debug(`[PROTOCOL] WELCOME — clientId=${msg.payload.clientId}`);
  return msg.payload;
}

export function handleSubscribeAck(
  msg: Extract<ServerMessage, { messageType: "SUBSCRIBE_ACK" }>,
): SubsAckMessage {
  log.debug(
    `[PROTOCOL] SUBSCRIBE_ACK — accepted=[${msg.payload.accepted}] rejected=[${msg.payload.rejected}]`,
  );
  return msg.payload;
}

export function handleUnsubscribeAck(
  msg: Extract<ServerMessage, { messageType: "UNSUBSCRIBE_ACK" }>,
): UnsubsAckMessage {
  log.debug(
    `[PROTOCOL] UNSUBSCRIBE_ACK — removed=[${msg.payload.removed}] notFound=[${msg.payload.notFound}]`,
  );
  return msg.payload;
}

export function handleTileSubscribeAck(
  msg: Extract<ServerMessage, { messageType: "TILE_SUBSCRIBE_ACK" }>,
): TileSubscribeAckMessage {
  log.debug(
    `[PROTOCOL] TILE_SUBSCRIBE_ACK — id=${msg.payload.subscriptionId} accepted=[${msg.payload.accepted}] rejected=[${msg.payload.rejected}] cadence=${msg.payload.cadenceMs}`,
  );
  return msg.payload;
}

export function handleTileUnsubscribeAck(
  msg: Extract<ServerMessage, { messageType: "TILE_UNSUBSCRIBE_ACK" }>,
): TileUnsubscribeAckMessage {
  log.debug(
    `[PROTOCOL] TILE_UNSUBSCRIBE_ACK — id=${msg.payload.subscriptionId} removed=${msg.payload.removed}`,
  );
  return msg.payload;
}

export function handleClosing(
  msg: Extract<ServerMessage, { messageType: "CLOSING" }>,
): ClosingMessage {
  log.debug(
    `[PROTOCOL] CLOSING — code=${msg.payload.code} retryable=${msg.payload.retryable}`,
  );
  return msg.payload;
}
