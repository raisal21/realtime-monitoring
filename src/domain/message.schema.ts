// domain/message.schema.ts

import { z } from "zod";

export const WelcomePayload = z.strictObject({
  status: z.string(),
  clientId: z.string(),
  availableStreams: z.array(z.number()),
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

const AlarmSeverity = z.enum(["INFO", "WARNING", "CRITICAL"]);

const AlarmAcknowledgement = z.strictObject({
  operatorName: z.string(),
  role: z.string(),
  timestamp: z.number(),
});

export const Alarm = z.strictObject({
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
  closeCode: z.number(),
});

export const ErrorSchema = z.strictObject({
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
    messageType: z.literal("ERROR"),
    timestamp: z.number(),
    error: ErrorSchema,
  }),
]);
