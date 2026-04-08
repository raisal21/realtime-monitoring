import { createStore, StateCreator } from "zustand";
import { AlarmSeverity } from "../src/domain/message.types.ts";
import { StreamDef } from "../src/domain/constants.ts";

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

export const createConnectionSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  ConnectionSlice
> = (set) => ({
  status: "OFFLINE",
  clientId: null,
  error: null,
  availableStreams: [],

  updateConnectionStatus: (newStatus) =>
    set({
      status: newStatus,
      ...(newStatus !== "ERROR" && { error: null }),
    }),
  registerClient: (id) => set({ clientId: id }),
  setError: (err) => set({ error: err, status: "ERROR" }),
});

export interface TelemetryPoint {
  timestamp: number;
  sensorValue: number;
}

export interface TelemetrySlice {
  telemetryStream: TelemetryPoint[];
  bufferCapacity: number;
  insertTelemetryPoint: (point: TelemetryPoint) => void;
}

export const createTelemetrySlice: StateCreator<
  GlobalRigState,
  [],
  [],
  TelemetrySlice
> = (set) => ({
  telemetryStream: [],
  bufferCapacity: 200,

  insertTelemetryPoint: (newPoint) =>
    set((state) => {
      if (!newPoint) return state;

      const current = state.telemetryStream;
      const capacity = state.bufferCapacity;

      const nextStream =
        current.length >= capacity
          ? [...current.slice(1), newPoint]
          : [...current, newPoint];

      return { telemetryStream: nextStream };
    }),
});

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

export const createAlarmSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  AlarmSlice
> = (set) => ({
  alarmRegistry: new Map<string, AlarmEntity>(),

  registerAlarm: (alarm) =>
    set((state) => {
      const updatedMap = new Map(state.alarmRegistry);
      updatedMap.set(alarm.uuid, alarm);
      return { alarmRegistry: updatedMap };
    }),

  resolveAlarm: (uuid) =>
    set((state) => {
      const updatedMap = new Map(state.alarmRegistry);
      updatedMap.delete(uuid);
      return { alarmRegistry: updatedMap };
    }),

  clearAllAlarms: () =>
    set({
      alarmRegistry: new Map<string, AlarmEntity>(),
    }),
});

export interface SubscriptionSlice {
  activeTopics: Set<StreamDef>;
  subscribe: (topic: StreamDef) => void;
}

const createSubscriptionSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  activeTopics: new Set<StreamDef>(),

  subscribe: (topic) => {
    const currentConnectionStatus = get().status;

    if (currentConnectionStatus === "ONLINE") {
      set((state) => ({
        activeTopics: new Set([...state.activeTopics, topic]),
      }));
    } else {
      console.error("Operation has been decline");
    }
  },
});

export const globalRigStore = createStore<GlobalRigState>()((...args) => ({
  ...createConnectionSlice(...args),
  ...createTelemetrySlice(...args),
  ...createAlarmSlice(...args),
  ...createSubscriptionSlice(...args),
}));
