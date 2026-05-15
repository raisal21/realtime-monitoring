// Phase 10.h: legacy reducer code stripped. File now exposes Zustand-backed
// shims for `useUi()`, `useChart()`, `useSettings()` so existing call sites
// keep their `{ state, dispatch }` API. Provider components and Context
// objects are gone — consumers either use these hooks or switch to direct
// `useStore(globalRigStore, ...)` selector form.
//
// Future cleanup (10.i / beyond): retire dispatch shims by migrating cold
// consumers to direct slice action calls, then delete this file entirely.

import type React from "react";
import { useStore } from "zustand";
import type { UnitSystem } from "@/lib/units";
import { globalRigStore } from "@/store/index-store";
import type {
  Theme,
  Density,
  FontSize,
  SampleRate,
} from "@/store/slices/settings-slice";
import type { UiState } from "@/store/slices/ui-slice";
import type {
  ChartMode,
  ChartState,
  RangePreset,
} from "@/store/slices/chart-slice";

export { TRACKS_META } from "@/data/dashboard-static";
export { FS_SCALE } from "@/store/slices/settings-slice";
export type { ChartMode };
export type { Theme, Density, FontSize };

// ─── UI ──────────────────────────────────────────────────────────────────────

type UiAction =
  | { type: "TOGGLE_GAUGE_SIDEBAR" }
  | { type: "TOGGLE_ALARM_SIDEBAR" }
  | { type: "TOGGLE_BOTH_SIDEBARS" }
  | { type: "TOGGLE_LEFT_RAIL" }
  | { type: "SET_LEFT_RAIL"; value: UiState["leftRail"] }
  | { type: "SET_SETTINGS_POPOVER"; open: boolean }
  | { type: "SET_ZOOM_POPOVER"; open: boolean }
  | { type: "SET_DISPLAY_LAYOUT_POPOVER"; open: boolean }
  | { type: "OPEN_ACK_MODAL"; alarmId: string }
  | { type: "CLOSE_ACK_MODAL" }
  | { type: "TOGGLE_ALARM_FILTER"; filter: keyof UiState["alarmFilters"] };

const uiDispatch: React.Dispatch<UiAction> = (a) => {
  const g = globalRigStore.getState();
  switch (a.type) {
    case "TOGGLE_GAUGE_SIDEBAR":
      return g.toggleGaugeSidebar();
    case "TOGGLE_ALARM_SIDEBAR":
      return g.toggleAlarmSidebar();
    case "TOGGLE_BOTH_SIDEBARS":
      return g.toggleBothSidebars();
    case "TOGGLE_LEFT_RAIL":
      return g.toggleLeftRail();
    case "SET_LEFT_RAIL":
      return g.setLeftRail(a.value);
    case "SET_SETTINGS_POPOVER":
      return g.setSettingsPopover(a.open);
    case "SET_ZOOM_POPOVER":
      return g.setZoomPopover(a.open);
    case "SET_DISPLAY_LAYOUT_POPOVER":
      return g.setDisplayLayoutPopover(a.open);
    case "OPEN_ACK_MODAL":
      return g.openAckModal(a.alarmId);
    case "CLOSE_ACK_MODAL":
      return g.closeAckModal();
    case "TOGGLE_ALARM_FILTER":
      return g.toggleAlarmFilter(a.filter);
  }
};

export function useUi() {
  const state = useStore(globalRigStore, (s) => s.ui);
  return { state, dispatch: uiDispatch };
}

// ─── Chart ───────────────────────────────────────────────────────────────────

type ChartAction =
  | { type: "SET_MODE"; mode: ChartMode }
  | { type: "SET_CROSSHAIR_VALUE"; value: number | null }
  | { type: "TOGGLE_LIVE" }
  | { type: "SET_LIVE"; live: boolean }
  | { type: "SET_RANGE_PRESET"; preset: RangePreset }
  | { type: "SET_RULER_RANGE"; min: number; max: number }
  | { type: "SET_LOG_TRACK_RANGE"; min: number; max: number }
  | { type: "SET_SLIDER_MODE"; value: boolean }
  | { type: "TOGGLE_TRACE_VISIBILITY"; trace: string }
  | { type: "SET_TRACK_ORDER"; order: string[] }
  | { type: "SET_TRACK_WIDTH"; trackId: string; width: number }
  | { type: "TOGGLE_TRACK_VISIBILITY"; trackId: string }
  | { type: "RESET_TRACK_LAYOUT" };

const chartDispatch: React.Dispatch<ChartAction> = (a) => {
  const g = globalRigStore.getState();
  switch (a.type) {
    case "SET_MODE":
      return g.setMode(a.mode);
    case "SET_CROSSHAIR_VALUE":
      return g.setCrosshairValue(a.value);
    case "TOGGLE_LIVE":
      return g.toggleLive();
    case "SET_LIVE":
      return g.setLive(a.live);
    case "SET_RANGE_PRESET":
      return g.setRangePreset(a.preset);
    case "SET_RULER_RANGE":
      return g.setRulerRange(a.min, a.max);
    case "SET_LOG_TRACK_RANGE":
      return g.setLogTrackRange(a.min, a.max);
    case "SET_SLIDER_MODE":
      return g.setSliderMode(a.value);
    case "TOGGLE_TRACE_VISIBILITY":
      return g.toggleTraceVisibility(a.trace);
    case "SET_TRACK_ORDER":
      return g.setTrackOrder(a.order);
    case "SET_TRACK_WIDTH":
      return g.setTrackWidth(a.trackId, a.width);
    case "TOGGLE_TRACK_VISIBILITY":
      return g.toggleTrackVisibility(a.trackId);
    case "RESET_TRACK_LAYOUT":
      return g.resetTrackLayout();
  }
};

export function useChart(): {
  state: ChartState;
  dispatch: React.Dispatch<ChartAction>;
} {
  const state = useStore(globalRigStore, (s) => s.chart);
  return { state, dispatch: chartDispatch };
}

// ─── Settings ────────────────────────────────────────────────────────────────

type SettingsAction =
  | { type: "SET_THEME"; theme: Theme }
  | { type: "SET_DENSITY"; density: Density }
  | { type: "SET_FONT_SIZE"; size: FontSize }
  | { type: "SET_SAMPLE_RATE"; rate: SampleRate }
  | { type: "TOGGLE_SMOOTHING" }
  | { type: "TOGGLE_SOUND" }
  | { type: "TOGGLE_NOTIFICATIONS" }
  | { type: "SET_UNIT_SYSTEM"; system: UnitSystem };

const settingsDispatch: React.Dispatch<SettingsAction> = (a) => {
  const g = globalRigStore.getState();
  switch (a.type) {
    case "SET_THEME":
      return g.setTheme(a.theme);
    case "SET_DENSITY":
      return g.setDensity(a.density);
    case "SET_FONT_SIZE":
      return g.setFontSize(a.size);
    case "SET_SAMPLE_RATE":
      return g.setSampleRate(a.rate);
    case "TOGGLE_SMOOTHING":
      return g.toggleSmoothing();
    case "TOGGLE_SOUND":
      return g.toggleSound();
    case "TOGGLE_NOTIFICATIONS":
      return g.toggleNotifications();
    case "SET_UNIT_SYSTEM":
      return g.setUnitSystem(a.system);
  }
};

export function useSettings() {
  const state = useStore(globalRigStore, (s) => s.settings);
  return { state, dispatch: settingsDispatch };
}
