// message.types.ts

import * as z from "zod";
import {
  WelcomePayload,
  SubsAckPayload,
  UnsubsAckPayload,
  AlarmSeverity,
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
export type AlarmSeverity = z.infer<typeof AlarmSeverity>;
export type ClosingMessage = z.infer<typeof ClosingPayload>;

export type ServerMessage = z.infer<typeof ServerSchema>;

export type DrillUpdate = z.infer<typeof DrillSchema>;
export type GeoUpdate = z.infer<typeof GeoSchema>;
