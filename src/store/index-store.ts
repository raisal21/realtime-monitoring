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
  sendMsg: null,

  updateConnectionStatus: (newStatus) =>
    set({
      status: newStatus,
      ...(newStatus !== "ERROR" && { error: null }),
    }),
  registerClient: (id) => set({ clientId: id }),
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
    const state = get(); // Ambil seluruh state saat ini

    if (state.status === "ONLINE" && state.sendMsg) {
      state.sendMsg({
        messageType: "SUBSCRIBE",
        payload: { streams: [topic] },
      });

      set({
        activeTopics: new Set([...state.activeTopics, topic]),
      });
    } else {
      console.error(
        "[STORE] Gagal subscribe: Koneksi offline atau sender belum siap",
      );
    }
  },

  unsubscribe: (topic) => {
    const state = get();

    if (state.status === "ONLINE" && state.sendMsg) {
      state.sendMsg({
        messageType: "UNSUBSCRIBE",
        payload: { streams: [topic] },
      });

      const updatedTopics = new Set(state.activeTopics);
      updatedTopics.delete(topic);

      set({ activeTopics: updatedTopics });
    } else {
      console.error(
        "[STORE] Gagal unsubscribe: Koneksi offline atau sender belum siap",
      );
    }
  },
});

export const globalRigStore = createStore<GlobalRigState>()((...args) => ({
  ...createConnectionSlice(...args),
  ...createTelemetrySlice(...args),
  ...createAlarmSlice(...args),
  ...createSubscriptionSlice(...args),
}));
