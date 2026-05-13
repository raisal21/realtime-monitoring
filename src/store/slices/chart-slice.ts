import type { StateCreator } from "zustand";
import { TRACKS_META, RANGE_PRESETS_QUICK } from "@/data/dashboard-static";
import type { GlobalRigState } from "../store.types";

export type ChartMode = "time" | "depth";
export type RangePreset = (typeof RANGE_PRESETS_QUICK)[number]["id"];
type Range = { min: number; max: number };

export type ChartState = {
  mode: ChartMode;
  liveMode: boolean;
  rangePreset: RangePreset | null;
  rulerRange: Range | null;
  logTrackRange: Range | null;
  wellProfileSlider: boolean;
  rulerSlider: boolean;
  traceVisibility: Record<string, boolean>;
  trackOrder: string[];
  trackWidths: Record<string, number>;
  trackVisibility: Record<string, boolean>;
  crosshairValue: number | null;
};

interface ChartActions {
  setMode: (mode: ChartMode) => void;
  setCrosshairValue: (value: number | null) => void;
  toggleLive: () => void;
  setLive: (live: boolean) => void;
  setRangePreset: (preset: RangePreset) => void;
  setRulerRange: (min: number, max: number) => void;
  setLogTrackRange: (min: number, max: number) => void;
  setSliderMode: (value: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleTraceVisibility: (trace: string) => void;
  setTrackOrder: (order: string[]) => void;
  setTrackWidth: (trackId: string, width: number) => void;
  toggleTrackVisibility: (trackId: string) => void;
  resetTrackLayout: () => void;
  resetChart: () => void;
}

export interface ChartSlice extends ChartActions {
  chart: ChartState;
}

const chartInitial: ChartState = {
  mode: "depth",
  liveMode: true,
  rangePreset: "1h",
  rulerRange: null,
  logTrackRange: null,
  wellProfileSlider: false,
  rulerSlider: false,
  crosshairValue: null,
  traceVisibility: {
    rpm: true,
    wob: true,
    torque: true,
    spp: true,
    hkld: true,
    gamma: true,
    rop: true,
    h2s: true,
    inc: true,
    azi: true,
  },
  trackOrder: TRACKS_META.map((t) => t.id),
  trackWidths: Object.fromEntries(
    TRACKS_META.map((t) => [t.id, t.defaultWidth]),
  ),
  trackVisibility: Object.fromEntries(TRACKS_META.map((t) => [t.id, true])),
};

const enterSliderMode = (s: ChartState): ChartState => ({
  ...s,
  liveMode: false,
  rangePreset: null,
  wellProfileSlider: true,
  rulerSlider: true,
});

const enterLiveMode = (s: ChartState, preset: RangePreset = "1h"): ChartState => ({
  ...s,
  liveMode: true,
  rangePreset: s.rangePreset ?? preset,
  rulerRange: null,
  logTrackRange: null,
  wellProfileSlider: false,
  rulerSlider: false,
});

export const createChartSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  ChartSlice
> = (set) => ({
  chart: chartInitial,

  setMode: (mode) =>
    set((s) => ({
      chart: {
        ...s.chart,
        mode,
        crosshairValue: null,
        rulerRange: null,
        logTrackRange: null,
      },
    })),

  setCrosshairValue: (value) =>
    set((s) => ({ chart: { ...s.chart, crosshairValue: value } })),

  toggleLive: () =>
    set((s) => ({
      chart: s.chart.liveMode ? enterSliderMode(s.chart) : enterLiveMode(s.chart),
    })),

  setLive: (live) =>
    set((s) => ({
      chart: live ? enterLiveMode(s.chart) : enterSliderMode(s.chart),
    })),

  setRangePreset: (preset) =>
    set((s) => ({
      chart: {
        ...s.chart,
        rangePreset: preset,
        liveMode: true,
        rulerRange: null,
        logTrackRange: null,
        wellProfileSlider: false,
        rulerSlider: false,
      },
    })),

  setRulerRange: (min, max) =>
    set((s) => ({
      chart: {
        ...s.chart,
        rulerRange: { min, max },
        logTrackRange: null,
        liveMode: false,
        rangePreset: null,
        wellProfileSlider: true,
        rulerSlider: true,
      },
    })),

  setLogTrackRange: (min, max) =>
    set((s) => ({
      chart: {
        ...s.chart,
        logTrackRange: { min, max },
        liveMode: false,
        rangePreset: null,
        wellProfileSlider: true,
        rulerSlider: true,
      },
    })),

  setSliderMode: (value) =>
    set((s) => ({
      chart: value ? enterSliderMode(s.chart) : enterLiveMode(s.chart),
    })),

  zoomIn: () => set((s) => ({ chart: enterSliderMode(s.chart) })),
  zoomOut: () => set((s) => ({ chart: enterSliderMode(s.chart) })),

  resetZoom: () =>
    set((s) => ({
      chart: {
        ...s.chart,
        liveMode: true,
        rangePreset: "1h",
        rulerRange: null,
        logTrackRange: null,
        wellProfileSlider: false,
        rulerSlider: false,
      },
    })),

  toggleTraceVisibility: (trace) =>
    set((s) => ({
      chart: {
        ...s.chart,
        traceVisibility: {
          ...s.chart.traceVisibility,
          [trace]: !s.chart.traceVisibility[trace],
        },
      },
    })),

  setTrackOrder: (order) =>
    set((s) => ({ chart: { ...s.chart, trackOrder: order } })),

  setTrackWidth: (trackId, width) =>
    set((s) => ({
      chart: {
        ...s.chart,
        trackWidths: { ...s.chart.trackWidths, [trackId]: width },
      },
    })),

  toggleTrackVisibility: (trackId) =>
    set((s) => ({
      chart: {
        ...s.chart,
        trackVisibility: {
          ...s.chart.trackVisibility,
          [trackId]: !s.chart.trackVisibility[trackId],
        },
      },
    })),

  resetTrackLayout: () =>
    set((s) => ({
      chart: {
        ...s.chart,
        trackWidths: Object.fromEntries(
          TRACKS_META.map((t) => [t.id, t.defaultWidth]),
        ),
        trackVisibility: Object.fromEntries(
          TRACKS_META.map((t) => [t.id, true]),
        ),
      },
    })),

  resetChart: () => set({ chart: chartInitial }),
});
