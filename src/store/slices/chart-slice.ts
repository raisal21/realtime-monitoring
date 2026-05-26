import type { StateCreator } from "zustand";
import { TRACKS_META, RANGE_PRESETS_QUICK } from "@/data/dashboard-static";
import type { TileResponse } from "@/services/tiles-client";
import type { GlobalRigState } from "../store.types";

export type ChartMode = "time" | "depth";
export type RangePreset = (typeof RANGE_PRESETS_QUICK)[number]["id"];
type TileStatus = "idle" | "loading" | "ready" | "error";
type Range = { min: number; max: number };

export type ChartState = {
  mode: ChartMode;
  liveMode: boolean;
  rangePreset: RangePreset | null;
  rulerRange: Range | null;
  logTrackRange: Range | null;
  tileStatus: TileStatus;
  tileError: string | null;
  drillTiles: TileResponse | null;
  geoTiles: TileResponse | null;
  tileRange: Range | null;
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
  setTileLoading: () => void;
  setTiles: (drill: TileResponse, geo: TileResponse, range: Range) => void;
  setTileError: (message: string) => void;
  clearTiles: () => void;
  setSliderMode: (value: boolean) => void;
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
  tileStatus: "idle",
  tileError: null,
  drillTiles: null,
  geoTiles: null,
  tileRange: null,
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
    set((s) => ({ chart: { ...s.chart, rangePreset: preset } })),

  setRulerRange: (min, max) =>
    set((s) => {
      const currentInner = s.chart.logTrackRange;
      const nextInner =
        currentInner && min <= currentInner.min && currentInner.max <= max
          ? currentInner
          : null;
      return {
        chart: {
          ...s.chart,
          rulerRange: { min, max },
          logTrackRange: nextInner,
          liveMode: false,
          wellProfileSlider: true,
          rulerSlider: true,
        },
      };
    }),

  setLogTrackRange: (min, max) =>
    set((s) => ({
      chart: {
        ...s.chart,
        logTrackRange: { min, max },
        liveMode: false,
        wellProfileSlider: true,
        rulerSlider: true,
      },
    })),

  setTileLoading: () =>
    set((s) => ({
      chart: { ...s.chart, tileStatus: "loading", tileError: null },
    })),

  setTiles: (drill, geo, range) =>
    set((s) => ({
      chart: {
        ...s.chart,
        tileStatus: "ready",
        tileError: null,
        drillTiles: drill,
        geoTiles: geo,
        tileRange: range,
      },
    })),

  setTileError: (message) =>
    set((s) => ({
      chart: { ...s.chart, tileStatus: "error", tileError: message },
    })),

  // No-op when already cleared — useTileSync calls this on every narrow /
  // depth-mode render, and a same-reference return skips the store update.
  clearTiles: () =>
    set((s) =>
      s.chart.tileStatus === "idle" && s.chart.tileRange === null
        ? s
        : {
            chart: {
              ...s.chart,
              tileStatus: "idle",
              tileError: null,
              drillTiles: null,
              geoTiles: null,
              tileRange: null,
            },
          },
    ),

  setSliderMode: (value) =>
    set((s) => ({
      chart: value ? enterSliderMode(s.chart) : enterLiveMode(s.chart),
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
