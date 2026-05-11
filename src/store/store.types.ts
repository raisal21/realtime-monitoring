import type {
  AlarmSeverity,
  ConnectionStatus,
  DrillUpdate,
  GeoUpdate,
} from "@/domain/message.types";
import { StreamDef } from "@/domain/constants";
import type { UiSlice } from "./slices/ui-slice";
import type { ChartSlice } from "./slices/chart-slice";
import type { SettingsSlice } from "./slices/settings-slice";
import type { ToastSlice } from "./slices/toast-slice";

export interface GlobalRigState
  extends ConnectionSlice,
    TelemetrySlice,
    AlarmSlice,
    SubscriptionSlice,
    UiSlice,
    ChartSlice,
    SettingsSlice,
    ToastSlice {}

export interface ConnectionError {
  code: string;
  reason: string;
}

export interface ConnectionState {
  status: ConnectionStatus;
  clientId: string | null;
  error?: ConnectionError | null;
  availableStreams: number[];
  delayMs: number | null;
  attempt: number | null;
  sendMsg: ((payload: object) => void) | null;
  retryFn: (() => void) | null;
}

export interface ConnectionActions {
  updateConnectionStatus: (status: ConnectionState["status"]) => void;
  registerClient: (clientId: string) => void;

  setAttempt: (attempt: number) => void;
  setDelay: (delayMs: number) => void;
  setError: (error: ConnectionState["error"]) => void;

  setAvailableStreams: (streams: number[]) => void;
  setSender: (fn: (payload: object) => void) => void;

  setRetrier: (fn: () => void) => void;
  triggerRetry: () => void;
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
  id: string;
  code: string;
  severity: AlarmSeverity;
  message: string;
  timestamp: number;
}

export interface AlarmSlice {
  alarmRegistry: Map<string, AlarmEntity>;
  registerAlarm: (alarm: AlarmEntity) => void;

  ackAlarm: (id: string, operatorName: string, role: string) => void;
  resolveAlarm: (id: string) => void;
}

export interface SubscriptionSlice {
  activeTopics: Set<StreamDef>;
  subscribe: (topic: StreamDef) => void;
  unsubscribe: (topic: StreamDef) => void;
  reconcileTopics: (serverTopics: number[]) => void;
  restoreSubscriptions: () => void;
}
