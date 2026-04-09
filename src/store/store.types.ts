import type {
  AlarmSeverity,
  ConnectionStatus,
} from "../domain/message.types.ts";
import { StreamDef } from "../domain/constants.ts";

export interface GlobalRigState
  extends ConnectionSlice, TelemetrySlice, AlarmSlice, SubscriptionSlice {}

export interface ConnectionError {
  code: string;
  reason: string;
}

export interface ConnectionState {
  status: "OFFLINE" | "CONNECTING" | "ONLINE" | "ERROR";
  clientId: string | null;
  error?: ConnectionError | null;
  availableStreams: number[];
}

export interface ConnectionActions {
  updateConnectionStatus: (status: ConnectionState["status"]) => void;
  registerClient: (clientId: string) => void;
  setError: (error: ConnectionState["error"]) => void;
}

export interface ConnectionSlice extends ConnectionState, ConnectionActions {}

export interface TelemetryPoint {
  timestamp: number;
  sensorValue: number;
}

export interface TelemetrySlice {
  telemetryStream: TelemetryPoint[];
  bufferCapacity: number;
  insertTelemetryPoint: (point: TelemetryPoint) => void;
}

export interface AlarmEntity {
  uuid: string;
  severity: AlarmSeverity;
  message: string;
  timestamp: number;
}

export interface AlarmSlice {
  alarmRegistry: Map<string, AlarmEntity>;
  registerAlarm: (alarm: AlarmEntity) => void;
  resolveAlarm: (uuid: string) => void;
  clearAllAlarms: () => void;
}

export interface SubscriptionSlice {
  activeTopics: Set<StreamDef>;
  subscribe: (topic: StreamDef) => void;
}
