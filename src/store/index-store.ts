import { createStore } from "zustand";
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";
import { log } from "@/utils/logger";
import type { StateCreator } from "zustand";
import type {
  GlobalRigState,
  ConnectionSlice,
  TelemetrySlice,
  AlarmSlice,
  SubscriptionSlice,
  AlarmEntity,
} from "./store.types";
import { createUiSlice } from "./slices/ui-slice";
import { createChartSlice } from "./slices/chart-slice";
import { createSettingsSlice } from "./slices/settings-slice";
import { createToastSlice } from "./slices/toast-slice";
import { StreamDef } from "@/domain/constants";

export const createConnectionSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  ConnectionSlice
> = (set, get) => ({
  status: "OFFLINE",
  clientId: null,
  error: null,
  availableStreams: [],
  sendMsg: null,
  attempt: null,
  delayMs: null,
  retryFn: null,

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
  setRetrier: (fn) => set({ retryFn: fn }),
  triggerRetry: () => {
    const { status, retryFn } = get();
    if (status !== "ERROR") {
      log.warn(
        "[STORE] triggerRetry called but status is not ERROR — ignoring",
      );
      return;
    }
    if (!retryFn) {
      log.warn("[STORE] triggerRetry called but retryFn is not set");
      return;
    }
    retryFn();
  },
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
      updatedMap.set(alarm.id, alarm);
      return { alarmRegistry: updatedMap };
    }),

  ackAlarm: (id: string, operatorName: string, role: string) => {
    const { status, sendMsg } = get();
    if (status !== "ONLINE" || !sendMsg) {
      log.warn(
        "[STORE] Cannot ackowloledge alarm — offline or sender not ready.",
      );
      return;
    }
    sendMsg({
      messageType: "ALARM_ACK",
      payload: {
        alarmId: id,
        operatorName,
        role,
        timestamp: Date.now(),
      },
    });
  },

  resolveAlarm: (id) =>
    set((state) => {
      const updatedMap = new Map(state.alarmRegistry);
      updatedMap.delete(id);
      return { alarmRegistry: updatedMap };
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

  restoreSubscriptions: () => {
    const { status, sendMsg, activeTopics } = get();
    if (status !== "ONLINE" || !sendMsg || activeTopics.size === 0) return;

    log.info(
      `[STORE] Restoring ${activeTopics.size} subscription(s) after reconnect`,
    );
    sendMsg({
      messageType: "SUBSCRIBE",
      payload: { streams: [...activeTopics] },
    });
  },
});

export const globalRigStore = createStore<GlobalRigState>()(
  subscribeWithSelector(
  persist(
    (...args) => ({
      ...createConnectionSlice(...args),
      ...createTelemetrySlice(...args),
      ...createAlarmSlice(...args),
      ...createSubscriptionSlice(...args),
      ...createUiSlice(...args),
      ...createChartSlice(...args),
      ...createSettingsSlice(...args),
      ...createToastSlice(...args),
    }),
    {
      name: "rtdc-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Allowlist persisted slices. Connection/Telemetry/Alarm/Subscription
      // are runtime/server-driven — persisting would resurrect stale state.
      partialize: (s) => ({
        ui: s.ui,
        chart: s.chart,
        settings: s.settings,
      }),
      // version 0 → 1: legacy `rtdc.unitSystem` is lifted into
      // `settings.unitSystem` at slice-init time (see settings-slice.ts).
      // Future schema changes should branch on `version` here.
      migrate: (persisted) => persisted as GlobalRigState,
    },
  ),
  ),
);
