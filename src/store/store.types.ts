import type {
  AlarmSeverity,
  ConnectionStatus,
  DrillUpdate,
  GeoUpdate,
} from "@/domain/message.types";
import { StreamDef } from "@/domain/constants";
import type { StreamRing } from "@/lib/stream-ring";
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

interface ConnectionError {
  code: string;
  reason: string;
}

interface ConnectionState {
  status: ConnectionStatus;
  clientId: string | null;
  error?: ConnectionError | null;
  availableStreams: number[];
  delayMs: number | null;
  attempt: number | null;
  sendMsg: ((payload: object) => void) | null;
  retryFn: (() => void) | null;
}

interface ConnectionActions {
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

export interface TelemetrySlice {
  drillRing: StreamRing<DrillUpdate>;
  geoRing: StreamRing<GeoUpdate>;
  // Monotonic insert counters. The rings mutate in place and keep a stable
  // reference, so bumping a counter is what notifies store subscribers.
  drillRev: number;
  geoRev: number;

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
