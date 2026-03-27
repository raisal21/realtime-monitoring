// services/rig-client.ts

import { log } from "../utils/logger";
import { ServerSchema } from "../domain/message.schema";
import { handleWelcome, handleSubscribeAck, handleClosing } from "./protocol";
import { PROTOCOL_VERSION, SUPPORTED_SCHEMA_ID } from "../domain/constants";
import type { StreamDef } from "../domain/constants";

const ClientState = {
  CLOSED: "CLOSED",
  CONNECTING: "CONNECTING",
  HANDSHAKING: "HANDSHAKING",
  ACTIVE: "ACTIVE",
  CLOSING: "CLOSING",
} as const;

type ClientState = (typeof ClientState)[keyof typeof ClientState];

const ValidTransitions: Record<ClientState, ClientState[]> = {
  [ClientState.CLOSED]: [ClientState.CONNECTING],
  [ClientState.CONNECTING]: [ClientState.HANDSHAKING, ClientState.CLOSING],
  [ClientState.HANDSHAKING]: [ClientState.ACTIVE, ClientState.CLOSING],
  [ClientState.ACTIVE]: [ClientState.CLOSING],
  [ClientState.CLOSING]: [ClientState.CLOSED],
};

type RigClient = {
  socket: WebSocketStream | null;
  state: ClientState;
};

function transitionState(client: RigClient, next: ClientState): void {
  const allowed = ValidTransitions[client.state] ?? [];

  if (!allowed.includes(next)) {
    log.warn(`[STATE] Illegal: ${client.state} → ${next}`);
    return;
  }

  log.debug(`[STATE] ${client.state} → ${next}`);
  client.state = next;
}

// =============================================================================
// Public Types
// =============================================================================

export type { RigClient };

// Discriminated union — connection-manager tahu apakah berhasil atau tidak
// tanpa kehilangan informasi retryable dari CLOSING.
export type ConnectResult =
  | { ok: true; reader: ReadableStreamDefaultReader<unknown>; clientId: string }
  | { ok: false; retryable: boolean; code: string };

type ConnectOptions = {
  clientId: string | null;
  streams: StreamDef[];
};

// =============================================================================
// Public API
// =============================================================================

export function createRigClient(): RigClient {
  return {
    socket: null,
    state: ClientState.CLOSED,
  };
}

// connect() adalah operasi atomik:
// Buka socket → Handshake → Subscribe → ACTIVE
// Kalau gagal di titik manapun, socket ditutup dan state dikembalikan ke CLOSED.
export async function connect(
  client: RigClient,
  options: ConnectOptions,
): Promise<ConnectResult> {
  if (!("WebSocketStream" in globalThis)) {
    throw new Error("WebSocketStream is not supported in this environment");
  }

  transitionState(client, ClientState.CONNECTING);

  const socket = new WebSocketStream("ws://localhost:8080", {
    signal: AbortSignal.timeout(5_000),
  });

  client.socket = socket;

  try {
    const { readable, writable } = await socket.opened;
    transitionState(client, ClientState.HANDSHAKING);

    const reader = readable.getReader();
    const writer = writable.getWriter();

    await writer.write(
      JSON.stringify({
        messageType: "HANDSHAKE",
        payload: {
          protocolVersion: PROTOCOL_VERSION,
          schemaId: SUPPORTED_SCHEMA_ID,
          ...(options.clientId ? { clientId: options.clientId } : {}),
        },
      }),
    );

    const { value: welcomeRaw } = await reader.read();
    const welcomeVal =
      typeof welcomeRaw === "string" ? JSON.parse(welcomeRaw) : welcomeRaw;
    const welcomeParsed = ServerSchema.safeParse(welcomeVal);

    if (!welcomeParsed.success) {
      throw new Error("Invalid WELCOME envelope");
    }

    if (welcomeParsed.data.messageType === "CLOSING") {
      const closing = handleClosing(welcomeParsed.data);
      log.warn(`[RIG] Rejected at handshake — code=${closing.code}`);
      return { ok: false, retryable: closing.retryable, code: closing.code };
    }

    if (welcomeParsed.data.messageType !== "WELCOME") {
      throw new Error(
        `[RIG] Expected WELCOME, got: ${welcomeParsed.data.messageType}`,
      );
    }
    const welcome = handleWelcome(welcomeParsed.data);

    const streamsToSubscribe = options.streams.filter((id) =>
      welcome.availableStreams.includes(id),
    );

    if (streamsToSubscribe.length === 0) {
      throw new Error("No supported streams available from server");
    }

    await writer.write(
      JSON.stringify({
        messageType: "SUBSCRIBE",
        payload: { streams: streamsToSubscribe },
      }),
    );

    const { value: subRaw } = await reader.read();
    const subValue = typeof subRaw === "string" ? JSON.parse(subRaw) : subRaw;
    const subParsed = ServerSchema.safeParse(subValue);

    if (!subParsed.success) {
      throw new Error("Invalid SUBSCRIBE_ACK envelope");
    }

    if (subParsed.data.messageType === "CLOSING") {
      const closing = handleClosing(subParsed.data);
      log.warn(`[RIG] Rejected at subscribe — code=${closing.code}`);
      return { ok: false, retryable: closing.retryable, code: closing.code };
    }

    if (subParsed.data.messageType !== "SUBSCRIBE_ACK") {
      throw new Error(
        `[RIG] Expected SUBSCRIBE_ACK, got: ${subParsed.data.messageType}`,
      );
    }
    handleSubscribeAck(subParsed.data);

    transitionState(client, ClientState.ACTIVE);

    return { ok: true, reader, clientId: welcome.clientId };
  } catch (err) {
    transitionState(client, ClientState.CLOSING);
    client.socket?.close();
    client.socket = null;
    transitionState(client, ClientState.CLOSED);
    throw err;
  }
}

export function disconnect(client: RigClient): void {
  if (client.state === ClientState.CLOSED) return;
  transitionState(client, ClientState.CLOSING);
  client.socket?.close();
  client.socket = null;
  transitionState(client, ClientState.CLOSED);
}
