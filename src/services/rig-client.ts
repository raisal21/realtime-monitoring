// services/rig-client.ts

import { log } from "@/utils/logger";
import { handleWelcome, handleClosing } from "@/services/protocol";
import {
  PROTOCOL_VERSION,
  SUPPORTED_SCHEMA_ID,
  HANDSHAKE_TIMEOUT_MS,
  WS_URL,
  WS_TOKEN,
} from "@/domain/constants";
import { parseServerMessage } from "@/domain/message.schema";
import { globalRigStore } from "@/store/index-store";

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
  abortController: AbortController | null;
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

// Discriminated union — connection-manager knows whether it succeeded
// without losing the retryable flag carried by CLOSING.
export type ConnectResult =
  | {
      ok: true;
      reader: ReadableStreamDefaultReader<unknown>;
      writer: WritableStreamDefaultWriter;
      clientId: string;
    }
  | { ok: false; retryable: boolean; code: string };

type ConnectOptions = {
  clientId: string | null;
};

// =============================================================================
// Public API
// =============================================================================

export function createRigClient(): RigClient {
  return {
    socket: null,
    state: ClientState.CLOSED,
    abortController: null,
  };
}

export async function connect(
  client: RigClient,
  options: ConnectOptions,
): Promise<ConnectResult> {
  if (!("WebSocketStream" in globalThis)) {
    throw new Error("WebSocketStream is not supported in this environment");
  }

  const ac = new AbortController();
  client.abortController = ac;

  transitionState(client, ClientState.CONNECTING);

  const socket = new WebSocketStream(WS_URL, {
    signal: ac.signal,
  });

  client.socket = socket;

  try {
    const { readable, writable } = await withTimeout(
      socket.opened,
      HANDSHAKE_TIMEOUT_MS,
    );

    globalRigStore.getState().updateConnectionStatus("CONNECTING");
    transitionState(client, ClientState.HANDSHAKING);

    const reader = readable.getReader();
    const writer = writable.getWriter();

    await writer.write(
      JSON.stringify({
        messageType: "HANDSHAKE",
        payload: {
          protocolVersion: PROTOCOL_VERSION,
          schemaId: SUPPORTED_SCHEMA_ID,
          token: WS_TOKEN,
          ...(options.clientId ? { clientId: options.clientId } : {}),
        },
      }),
    );

    const { value: welcomeRaw } = await withTimeout(
      reader.read(),
      HANDSHAKE_TIMEOUT_MS,
    );
    const welcomeParsed = parseServerMessage(welcomeRaw);

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

    globalRigStore.getState().setAvailableStreams(welcome.availableStreams);
    transitionState(client, ClientState.ACTIVE);

    return { ok: true, reader, writer, clientId: welcome.clientId };
  } catch (err) {
    transitionState(client, ClientState.CLOSING);
    client.socket?.close();
    client.socket = null;
    client.abortController = null;
    transitionState(client, ClientState.CLOSED);
    throw err;
  }
}

export function disconnect(client: RigClient): void {
  if (client.state !== ClientState.CLOSED) {
    transitionState(client, ClientState.CLOSING);
    client.abortController?.abort();
    client.abortController = null;
    client.socket = null;
    transitionState(client, ClientState.CLOSED);
  }
}

function makeHandshakeTimeoutError(ms: number): Error {
  const err = new Error(`Handshake timed out after ${ms}ms`);
  err.name = "HandshakeTimeoutError";
  return err;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(makeHandshakeTimeoutError(ms)), ms);

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
