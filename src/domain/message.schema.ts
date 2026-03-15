// message.schema.ts

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

export const ErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
});

const SuccessMessage = z.discriminatedUnion("messageType", [
  z.strictObject({
    messageType: z.literal("WELCOME"),
    payload: WelcomePayload,
  }),
  z.strictObject({
    messageType: z.literal("SUBSCRIBE_ACK"),
    payload: SubsAckPayload,
  }),
  z.strictObject({
    messageType: z.literal("UNSUBSCRIBE_ACK"),
    payload: UnsubsAckPayload,
  }),
  z.strictObject({ messageType: z.literal("ALARM_RAISED"), payload: Alarm }),
  z.strictObject({ messageType: z.literal("ALARM_ACKED"), payload: Alarm }),
]);

const ErrorMessage = z.discriminatedUnion("messageType", [
  z.strictObject({ messageType: z.literal("ERROR") }),
  z.strictObject({ messageType: z.literal("WELCOME"), error: ErrorSchema }),
  z.strictObject({
    messageType: z.literal("SUBSCRIBE_ACK"),
    error: ErrorSchema,
  }),
  z.strictObject({
    messageType: z.literal("UNSUBSCRIBE_ACK"),
    error: ErrorSchema,
  }),
  z.strictObject({
    messageType: z.literal("ALARM_RAISED"),
    error: ErrorSchema,
  }),
  z.strictObject({ messageType: z.literal("ALARM_ACKED"), error: ErrorSchema }),
]);

export const ServerSchema = z.union([SuccessMessage, ErrorMessage]);
