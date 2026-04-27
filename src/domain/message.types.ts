// message.types.ts

import * as z from "zod";
import {
  WelcomePayload,
  SubsAckPayload,
  UnsubsAckPayload,
  AlarmSeverity,
  Alarm,
  ErrorSchema,
  ServerSchema,
  ClosingPayload,
  DrillSchema,
  GeoSchema,
} from "@/domain/message.schema";

export type ConnectionStatus =
  | "OFFLINE"
  | "CONNECTING"
  | "ONLINE"
  | "RECONNECTING"
  | "ERROR";

export type WelcomeMessage = z.infer<typeof WelcomePayload>;
export type SubsAckMessage = z.infer<typeof SubsAckPayload>;
export type UnsubsAckMessage = z.infer<typeof UnsubsAckPayload>;
export type AlarmMessage = z.infer<typeof Alarm>;
export type AlarmSeverity = z.infer<typeof AlarmSeverity>;
export type ClosingMessage = z.infer<typeof ClosingPayload>;
export type ErrorMessage = z.infer<typeof ErrorSchema>;

export type ServerMessage = z.infer<typeof ServerSchema>;

export type DrillUpdate = z.infer<typeof DrillSchema>;
export type GeoUpdate = z.infer<typeof GeoSchema>;
