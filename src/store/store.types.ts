import type {
  AlarmSeverity,
  ConnectionStatus,
} from "../domain/message.types.ts";
import { StreamDef } from "../domain/constants.ts";
import type { DrillUpdate, GeoUpdate } from "../domain/message.types.ts";

export interface GlobalRigState
  extends ConnectionSlice, TelemetrySlice, AlarmSlice, SubscriptionSlice {}

export interface ConnectionError {
  code: string;
  reason: string;
}

export interface ConnectionState {
  status: ConnectionStatus;
  clientId: string | null;
  error?: ConnectionError | null;
  availableStreams: number[];
  sendMsg: ((payload: object) => void) | null;
}

export interface ConnectionActions {
  updateConnectionStatus: (status: ConnectionState["status"]) => void;
  registerClient: (clientId: string) => void;
  setError: (error: ConnectionState["error"]) => void;
  setAvailableStreams: (streams: number[]) => void;
  setSender: (fn: (payload: object) => void) => void;
}

export interface ConnectionSlice extends ConnectionState, ConnectionActions {}

export interface TelemetryPoint {
  timestamp: number;
  sensorValue: number;
}

export interface TelemetrySlice {
  drillStream: DrillUpdate[];
  geoStream: GeoUpdate[];
  drillBufferCapacity: number;
  geoBufferCapacity: number;

  insertDrillPoint: (point: DrillUpdate) => void;
  insertGeoPoint: (point: GeoUpdate) => void;
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
  unsubscribe: (topic: StreamDef) => void;
}
