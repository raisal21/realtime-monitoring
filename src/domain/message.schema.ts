// domain/message.schema.ts

import { z } from "zod";

export const WelcomePayload = z.strictObject({
  status: z.string(),
  clientId: z.string(),
  availableStreams: z.array(z.number()),
  serverVersion: z.number(),
});

export const SubsAckPayload = z.strictObject({
  accepted: z.array(z.number()),
  rejected: z.array(z.number()),
  currentSubscriptions: z.array(z.number()),
});

export const UnsubsAckPayload = z.strictObject({
  removed: z.array(z.number()),
  notFound: z.array(z.number()),
  currentSubscriptions: z.array(z.number()),
});

export const TileSubscribeAckPayload = z.strictObject({
  subscriptionId: z.number(),
  accepted: z.array(z.string()),
  rejected: z.array(z.string()),
  spanMinutes: z.number(),
  res: z.string(),
  cadenceMs: z.number(),
});

export const TileUnsubscribeAckPayload = z.strictObject({
  subscriptionId: z.number(),
  removed: z.boolean(),
});

export const HistoryExtentBasePayload = z.strictObject({
  minTimeMs: z.number().nullable(),
  maxTimeMs: z.number().nullable(),
  minDepth: z.number().nullable(),
  maxDepth: z.number().nullable(),
});

export const HistorySharedExtentPayload = HistoryExtentBasePayload.extend({
  timeMode: z.string(),
  depthSource: z.string(),
  warning: z.string().nullable().optional(),
});

export const HistoryExtentPayload = z.strictObject({
  wellId: z.string(),
  streams: z.record(z.string(), HistoryExtentBasePayload),
  shared: HistorySharedExtentPayload,
  warnings: z.array(z.string()),
});

export const AlarmSeverity = z.enum(["INFO", "WARNING", "CRITICAL"]);

const AlarmAcknowledgement = z.strictObject({
  operatorName: z.string(),
  role: z.string(),
  timestamp: z.number(),
});

const Alarm = z.strictObject({
  id: z.string(),
  code: z.string(),
  message: z.string(),
  severity: AlarmSeverity,
  raisedAt: z.number(),
  acknowledged: z.boolean(),
  acknowledgedBy: z.optional(AlarmAcknowledgement),
});

export const ClosingPayload = z.strictObject({
  code: z.string(),
  reason: z.string(),
  retryable: z.boolean(),
  retryAfterMs: z.number().optional(),
  closeCode: z.number(),
});

const ErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
});

export const ServerSchema = z.discriminatedUnion("messageType", [
  z.strictObject({
    messageType: z.literal("WELCOME"),
    timestamp: z.number(),
    payload: WelcomePayload,
  }),
  z.strictObject({
    messageType: z.literal("SUBSCRIBE_ACK"),
    timestamp: z.number(),
    payload: SubsAckPayload,
  }),
  z.strictObject({
    messageType: z.literal("UNSUBSCRIBE_ACK"),
    timestamp: z.number(),
    payload: UnsubsAckPayload,
  }),
  z.strictObject({
    messageType: z.literal("TILE_SUBSCRIBE_ACK"),
    timestamp: z.number(),
    payload: TileSubscribeAckPayload,
  }),
  z.strictObject({
    messageType: z.literal("TILE_UNSUBSCRIBE_ACK"),
    timestamp: z.number(),
    payload: TileUnsubscribeAckPayload,
  }),
  z.strictObject({
    messageType: z.literal("HISTORY_EXTENT"),
    timestamp: z.number(),
    payload: HistoryExtentPayload,
  }),
  z.strictObject({
    messageType: z.literal("ALARM_RAISED"),
    timestamp: z.number(),
    payload: z.strictObject({ alarm: Alarm }),
  }),
  z.strictObject({
    messageType: z.literal("ALARM_ACKED"),
    timestamp: z.number(),
    payload: z.strictObject({ alarm: Alarm }),
  }),
  z.strictObject({
    messageType: z.literal("CLOSING"),
    timestamp: z.number(),
    payload: ClosingPayload,
  }),
  z.strictObject({
    messageType: z.literal("HEARTBEAT"),
    timestamp: z.number(),
    payload: z.null().optional(),
  }),
  z.strictObject({
    messageType: z.literal("ERROR"),
    timestamp: z.number(),
    error: ErrorSchema,
  }),
]);

export function parseServerMessage(raw: unknown) {
  const json = typeof raw === "string" ? JSON.parse(raw) : raw;
  return ServerSchema.safeParse(json);
}

export const DrillSchema = z.strictObject({
  timestamp: z.number(),
  depth: z.number(),
  sequence: z.number(),
  rpm: z.number(),
  wob: z.number(),
  torque: z.number(),
  spp: z.number(),
  hkld: z.number(),
  flow: z.number(),
});

export const GeoSchema = z.strictObject({
  timestamp: z.number(),
  depth: z.number(),
  sequence: z.number(),
  gamma: z.number(),
  rop: z.number(),
  h2s: z.number(),
  inc: z.number(),
  azi: z.number(),
});
