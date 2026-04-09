import { createStore } from "zustand";
import type { StateCreator } from "zustand";
import type {
  GlobalRigState,
  ConnectionSlice,
  TelemetrySlice,
  AlarmSlice,
  SubscriptionSlice,
  AlarmEntity,
} from "./store.types";
import { StreamDef } from "../domain/constants";

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
