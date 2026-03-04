export const ClientState = {
  CONNECTING: "CONNECTING",
  HANDSHAKING: "HANDSHAKING",
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  CLOSING: "CLOSING",
  CLOSED: "CLOSED",
} as const;

export type ClientState = (typeof ClientState)[keyof typeof ClientState];

export const StreamDef = {
  DRILL: 101,
  GEO: 102,
} as const;

export type StreamDef = (typeof StreamDef)[keyof typeof StreamDef];

const ValidTransitions: Record<ClientState, ClientState[]> = {
  [ClientState.CONNECTING]: [ClientState.HANDSHAKING, ClientState.CLOSING],
  [ClientState.HANDSHAKING]: [ClientState.CLOSED],
  [ClientState.ACTIVE]: [
    ClientState.IDLE,
    ClientState.CLOSING,
    ClientState.CLOSED,
  ],
  [ClientState.IDLE]: [
    ClientState.ACTIVE,
    ClientState.CLOSING,
    ClientState.CLOSED,
  ],
  [ClientState.CLOSING]: [ClientState.CLOSED],
  [ClientState.CLOSED]: [],
};

type RigClient = {
  socket: WebSocketStream | null;
  state: ClientState;
};

function transitionState(client: RigClient, nextState: ClientState) {
  // Prevent illegal state mutation to keep client lifecycle deterministic
  if (client.state === ClientState.CLOSED) return;

  const allowed = ValidTransitions[client.state] || [];
  if (allowed.includes(nextState)) {
    console.debug(`[STATE] ${client.state} → ${nextState}`);
    client.state = nextState;
  } else {
    console.warn(
      `[STATE ERROR] Ilegal transisi: ${client.state} -> ${nextState}`,
    );
  }
}

export function createRigClient(): RigClient {
  return {
    socket: null,
    state: ClientState.CLOSED,
  };
}

export async function connect(client: RigClient) {
  if (!("WebSocketStream" in globalThis)) {
    throw new Error("WebSocketStream not supported");
  }

  transitionState(client, ClientState.CONNECTING);

  const wsURL = "ws://localhost:8080";
  const socket = new WebSocketStream(wsURL, {
    signal: AbortSignal.timeout(5000),
  });

  client.socket = socket;

  const { readable, writable } = await socket.opened;

  transitionState(client, ClientState.HANDSHAKING);

  return { readable, writable };
}
