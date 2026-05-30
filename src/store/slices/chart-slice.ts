import type { StateCreator } from "zustand";
import { TRACKS_META, RANGE_PRESETS_QUICK } from "@/data/dashboard-static";
import {
  mergeTileResponse,
  projectOpenTileBucket,
  sharedTileDepthRange,
  sharedTileDataRange,
  tileDataRange,
  tileDepthRange,
  type TileRange,
  type TileRes,
  type TileResponse,
} from "@/services/tiles-client";
import type { ParsedTileFrame } from "@/services/binary-parser";
import type { GlobalRigState } from "../store.types";
import type { HistoryExtentMessage } from "@/domain/message.types";

export type ChartMode = "time" | "depth";
export type RangePreset = (typeof RANGE_PRESETS_QUICK)[number]["id"];
export type TileStatus = "idle" | "loading" | "ready" | "error";
export type HistoryExtentStatus = "idle" | "loading" | "ready" | "error";
export type Range = { min: number; max: number };
export type TileStreamName = "drill" | "geo";
export type ActiveTileSubscription = {
  subscriptionId: number;
  spanMinutes: number;
  res: TileRes;
  streams: TileStreamName[];
};

export type ChartState = {
  mode: ChartMode;
  liveMode: boolean;
  rangePreset: RangePreset | null;
  rulerRange: Range | null;
  logTrackRange: Range | null;
  customTileRange: Range | null;
  tileStatus: TileStatus;
  tileError: string | null;
  drillTiles: TileResponse | null;
  geoTiles: TileResponse | null;
  tileRange: Range | null;
  tileDepthRange: Range | null;
  historyExtentStatus: HistoryExtentStatus;
  historyExtentError: string | null;
  historyExtent: HistoryExtentMessage | null;
  wellProfileHistoryStatus: TileStatus;
  wellProfileHistoryError: string | null;
  wellProfileHistoryTiles: TileResponse | null;
  wellProfileHistoryRange: Range | null;
  activeWellProfileHistoryRequestId: number | null;
  activeTileSubscriptionId: number | null;
  tileSubscription: ActiveTileSubscription | null;
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
  setTileLoading: (range?: Range) => void;
  setTileSubscription: (
    subscription: ActiveTileSubscription,
    range?: Range,
  ) => void;
  setTiles: (
    drill: TileResponse,
    geo: TileResponse,
    range: Range,
    depthRange: Range | null,
  ) => void;
  setTileError: (message: string) => void;
  clearTiles: () => void;
  setHistoryExtentLoading: () => void;
  setHistoryExtent: (extent: HistoryExtentMessage) => void;
  setHistoryExtentError: (message: string) => void;
  setWellProfileHistoryRequest: (subscriptionId: number, range: Range) => void;
  setWellProfileHistoryError: (message: string) => void;
  clearWellProfileHistory: () => void;
  applyTileSnapshot: (frame: ParsedTileFrame) => void;
  applyTileUpdate: (frame: ParsedTileFrame) => void;
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
  customTileRange: null,
  tileStatus: "idle",
  tileError: null,
  drillTiles: null,
  geoTiles: null,
  tileRange: null,
  tileDepthRange: null,
  historyExtentStatus: "idle",
  historyExtentError: null,
  historyExtent: null,
  wellProfileHistoryStatus: "idle",
  wellProfileHistoryError: null,
  wellProfileHistoryTiles: null,
  wellProfileHistoryRange: null,
  activeWellProfileHistoryRequestId: null,
  activeTileSubscriptionId: null,
  tileSubscription: null,
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
  wellProfileSlider: true,
  rulerSlider: true,
});

const enterLiveMode = (s: ChartState, preset: RangePreset = "1h"): ChartState => ({
  ...s,
  liveMode: true,
  rangePreset: s.rangePreset ?? preset,
  rulerRange: null,
  logTrackRange: null,
  customTileRange: null,
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
        customTileRange: null,
      },
    })),

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
          customTileRange:
            s.chart.mode === "time" ? { min, max } : s.chart.customTileRange,
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

  setTileLoading: (range) =>
    set((s) => ({
      chart: {
        ...s.chart,
        tileStatus: "loading",
        tileError: null,
        tileRange: range ?? s.chart.tileRange,
      },
    })),

  setTileSubscription: (subscription, range) =>
    set((s) => ({
      chart: {
        ...s.chart,
        tileStatus: "loading",
        tileError: null,
        drillTiles: null,
        geoTiles: null,
        tileRange: range ?? null,
        tileDepthRange: null,
        activeTileSubscriptionId: subscription.subscriptionId,
        tileSubscription: subscription,
      },
    })),

  setTiles: (drill, geo, range, depthRange) =>
    set((s) => ({
      chart: {
        ...s.chart,
        tileStatus: "ready",
        tileError: null,
        drillTiles: drill,
        geoTiles: geo,
        tileRange: range,
        tileDepthRange: depthRange,
      },
    })),

  setTileError: (message) =>
    set((s) => ({
      chart: { ...s.chart, tileStatus: "error", tileError: message },
    })),

  // No-op when already cleared — useTileSync calls this on every narrow render,
  // and a same-reference return skips the store update.
  clearTiles: () =>
    set((s) =>
      s.chart.tileStatus === "idle" &&
      s.chart.tileRange === null &&
      s.chart.tileDepthRange === null &&
      s.chart.customTileRange === null
        ? s
        : {
            chart: {
              ...s.chart,
              tileStatus: "idle",
              tileError: null,
              drillTiles: null,
              geoTiles: null,
              tileRange: null,
              tileDepthRange: null,
              customTileRange: null,
              activeTileSubscriptionId: null,
              tileSubscription: null,
            },
          },
    ),

  setHistoryExtentLoading: () =>
    set((s) => ({
      chart: {
        ...s.chart,
        historyExtentStatus: "loading",
        historyExtentError: null,
        historyExtent: null,
      },
    })),

  setHistoryExtent: (extent) =>
    set((s) => ({
      chart: {
        ...s.chart,
        historyExtentStatus: "ready",
        historyExtentError: null,
        historyExtent: extent,
      },
    })),

  setHistoryExtentError: (message) =>
    set((s) => ({
      chart: {
        ...s.chart,
        historyExtentStatus: "error",
        historyExtentError: message,
        historyExtent: null,
      },
    })),

  setWellProfileHistoryRequest: (subscriptionId, range) =>
    set((s) => ({
      chart: {
        ...s.chart,
        wellProfileHistoryStatus: "loading",
        wellProfileHistoryError: null,
        wellProfileHistoryTiles: null,
        wellProfileHistoryRange: range,
        activeWellProfileHistoryRequestId: subscriptionId,
      },
    })),

  setWellProfileHistoryError: (message) =>
    set((s) => ({
      chart: {
        ...s.chart,
        wellProfileHistoryStatus: "error",
        wellProfileHistoryError: message,
        wellProfileHistoryTiles: null,
        wellProfileHistoryRange: null,
        activeWellProfileHistoryRequestId: null,
      },
    })),

  clearWellProfileHistory: () =>
    set((s) =>
      s.chart.wellProfileHistoryStatus === "idle" &&
      s.chart.wellProfileHistoryTiles === null &&
      s.chart.wellProfileHistoryRange === null &&
      s.chart.activeWellProfileHistoryRequestId === null
        ? s
        : {
            chart: {
              ...s.chart,
              wellProfileHistoryStatus: "idle",
              wellProfileHistoryError: null,
              wellProfileHistoryTiles: null,
              wellProfileHistoryRange: null,
              activeWellProfileHistoryRequestId: null,
            },
          },
    ),

  applyTileSnapshot: (frame) =>
    set((s) => {
      if (s.chart.activeWellProfileHistoryRequestId === frame.subscriptionId) {
        if (frame.stream !== "drill") return s;
        const headerRange = { min: frame.fromUnixMs, max: frame.toUnixMs };
        return {
          chart: {
            ...s.chart,
            wellProfileHistoryStatus: "ready",
            wellProfileHistoryError: null,
            wellProfileHistoryTiles: frame.tiles,
            wellProfileHistoryRange: tileDataRange(frame.tiles) ?? headerRange,
          },
        };
      }
      if (s.chart.activeTileSubscriptionId !== frame.subscriptionId) return s;
      const tiles = projectOpenTileBucket(frame.tiles, frame.toUnixMs);
      const drillTiles =
        frame.stream === "drill" ? tiles : s.chart.drillTiles;
      const geoTiles = frame.stream === "geo" ? tiles : s.chart.geoTiles;
      const headerRange = { min: frame.fromUnixMs, max: frame.toUnixMs };
      return {
        chart: {
          ...s.chart,
          tileStatus: "ready",
          tileError: null,
          drillTiles,
          geoTiles,
          tileRange: combineTileDataRange(drillTiles, geoTiles, headerRange),
          tileDepthRange: combineTileDepthRange(drillTiles, geoTiles),
        },
      };
    }),

  applyTileUpdate: (frame) =>
    set((s) => {
      if (s.chart.activeWellProfileHistoryRequestId === frame.subscriptionId) {
        return s;
      }
      if (s.chart.activeTileSubscriptionId !== frame.subscriptionId) return s;
      const tiles = projectOpenTileBucket(frame.tiles, frame.toUnixMs);
      const drillTiles =
        frame.stream === "drill"
          ? mergeTileResponse(s.chart.drillTiles, tiles, frame.replaceFromUnixMs)
          : s.chart.drillTiles;
      const geoTiles =
        frame.stream === "geo"
          ? mergeTileResponse(s.chart.geoTiles, tiles, frame.replaceFromUnixMs)
          : s.chart.geoTiles;
      const headerRange = { min: frame.fromUnixMs, max: frame.toUnixMs };
      return {
        chart: {
          ...s.chart,
          tileStatus: "ready",
          tileError: null,
          drillTiles,
          geoTiles,
          tileRange: combineTileDataRange(drillTiles, geoTiles, headerRange),
          tileDepthRange: combineTileDepthRange(drillTiles, geoTiles),
        },
      };
    }),

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

function combineTileDepthRange(
  drill: TileResponse | null,
  geo: TileResponse | null,
): TileRange | null {
  if (drill && geo) return sharedTileDepthRange(drill, geo);
  if (drill) return tileDepthRange(drill);
  if (geo) return tileDepthRange(geo);
  return null;
}

function combineTileDataRange(
  drill: TileResponse | null,
  geo: TileResponse | null,
  fallback: TileRange,
): TileRange {
  if (drill && geo) return sharedTileDataRange(drill, geo, fallback);
  if (drill) return tileDataRange(drill) ?? fallback;
  if (geo) return tileDataRange(geo) ?? fallback;
  return fallback;
}
