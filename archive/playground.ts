const currentAvailableStreams = globalRigStore.getState().availableStreams;

const streamsToSubscribe = options.streams.filter((id) =>
  currentAvailableStreams.includes(id),
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

const { value: subRaw } = await withTimeout(
  reader.read(),
  HANDSHAKE_TIMEOUT_MS,
);
const subParsed = parseServerMessage(subRaw);

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
