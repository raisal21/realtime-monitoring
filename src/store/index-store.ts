import { createStore } from "zustand";
import { log } from "../utils/logger";
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
  sendMsg: null,
  attempt: null,
  delayMs: null,

  updateConnectionStatus: (newStatus) =>
    set({
      status: newStatus,
      ...(newStatus !== "ERROR" && { error: null }),
    }),
  registerClient: (id) => set({ clientId: id }),
  setAttempt: (attempt) => set({ attempt: attempt }),
  setDelay: (delay) => set({ delayMs: delay }),
  setError: (err) => set({ error: err, status: "ERROR" }),
  setAvailableStreams: (streams) => set({ availableStreams: streams }),
  setSender: (fn) => set({ sendMsg: fn }),
});

export const createTelemetrySlice: StateCreator<
  GlobalRigState,
  [],
  [],
  TelemetrySlice
> = (set) => ({
  drillStream: [],
  geoStream: [],
  drillBufferCapacity: 200,
  geoBufferCapacity: 200,

  insertDrillPoint: (newPoint) =>
    set((state) => {
      if (!newPoint) return state;
      const current = state.drillStream;
      const nextStream =
        current.length >= state.drillBufferCapacity
          ? [...current.slice(1), newPoint]
          : [...current, newPoint];
      return { drillStream: nextStream };
    }),

  insertGeoPoint: (newPoint) =>
    set((state) => {
      if (!newPoint) return state;
      const current = state.geoStream;
      const nextStream =
        current.length >= state.geoBufferCapacity
          ? [...current.slice(1), newPoint]
          : [...current, newPoint];
      return { geoStream: nextStream };
    }),
});

export const createAlarmSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  AlarmSlice
> = (set, get) => ({
  alarmRegistry: new Map<string, AlarmEntity>(),

  registerAlarm: (alarm) =>
    set((state) => {
      const updatedMap = new Map(state.alarmRegistry);
      updatedMap.set(alarm.uuid, alarm);
      return { alarmRegistry: updatedMap };
    }),

  ackAlarm: (uuid: string) => {
    const { status, sendMsg } = get();
    if (status !== "ONLINE" || !sendMsg) {
      log.warn(
        "[STORE] Cannot ackowloledge alarm — offline or sender not ready.",
      );
      return;
    }
    sendMsg({ messageType: "ALARM_ACK", payload: { alarmId: uuid } });
  },

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
    const { status, sendMsg } = get();
    if (status !== "ONLINE" || !sendMsg) {
      log.warn("[STORE] Cannot subscribe — offline or sender not ready.");
      return;
    }
    sendMsg({ messageType: "SUBSCRIBE", payload: { streams: [topic] } });
  },

  unsubscribe: (topic) => {
    const { status, sendMsg } = get();
    if (status !== "ONLINE" || !sendMsg) {
      log.warn("[STORE] Cannot unsubscribe — offline or sender not ready.");
      return;
    }
    sendMsg({ messageType: "UNSUBSCRIBE", payload: { streams: [topic] } });
  },

  reconcileTopics: (serverTopics) => {
    set({ activeTopics: new Set(serverTopics as StreamDef[]) });
  },
});

export const globalRigStore = createStore<GlobalRigState>()((...args) => ({
  ...createConnectionSlice(...args),
  ...createTelemetrySlice(...args),
  ...createAlarmSlice(...args),
  ...createSubscriptionSlice(...args),
}));
