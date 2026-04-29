import React, {
  useReducer,
  useContext,
  createContext,
  type ReactNode,
} from "react";
import { TRACKS_META, RANGE_PRESETS_QUICK } from "@/data/dashboard-static";

export { TRACKS_META } from "@/data/dashboard-static";

type Theme = "gruvbox" | "tomorrow" | "solarized";
type Density = "compact" | "comfortable";
type FontSize = "sm" | "md" | "lg";

// Must mirror --fs-scale values in index.css so canvas/SVG renderers
// (ECharts axisLabel.fontSize, raw <text fontSize=...>) match CSS-driven text.
export const FS_SCALE: Record<FontSize, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.12,
};
type SampleRate = "10hz" | "5hz" | "1hz";

type UiState = {
  gaugeSidebar: "open" | "closed";
  alarmSidebar: "open" | "closed";
  leftRail: "expanded" | "collapsed";
  settingsPopover: boolean;
  zoomPopover: boolean;
  displayLayoutPopover: boolean;
  ackModal: { open: boolean; alarmId: string | null };
  alarmFilters: { critical: boolean; warning: boolean; info: boolean };
};

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

const uiInitial: UiState = {
  gaugeSidebar: "closed",
  alarmSidebar: "open",
  leftRail: "expanded",
  settingsPopover: false,
  zoomPopover: false,
  displayLayoutPopover: false,
  ackModal: { open: false, alarmId: null },
  alarmFilters: { critical: true, warning: true, info: true },
};

function uiReducer(s: UiState, a: UiAction): UiState {
  switch (a.type) {
    case "TOGGLE_GAUGE_SIDEBAR":
      return {
        ...s,
        gaugeSidebar: s.gaugeSidebar === "open" ? "closed" : "open",
      };
    case "TOGGLE_ALARM_SIDEBAR":
      return {
        ...s,
        alarmSidebar: s.alarmSidebar === "open" ? "closed" : "open",
      };
    case "TOGGLE_BOTH_SIDEBARS": {
      const target =
        s.gaugeSidebar === "open" && s.alarmSidebar === "open"
          ? "closed"
          : "open";
      return { ...s, gaugeSidebar: target, alarmSidebar: target };
    }
    case "TOGGLE_LEFT_RAIL":
      return {
        ...s,
        leftRail: s.leftRail === "expanded" ? "collapsed" : "expanded",
      };
    case "SET_LEFT_RAIL":
      return { ...s, leftRail: a.value };
    case "SET_SETTINGS_POPOVER":
      return { ...s, settingsPopover: a.open };
    case "SET_ZOOM_POPOVER":
      return { ...s, zoomPopover: a.open };
    case "SET_DISPLAY_LAYOUT_POPOVER":
      return { ...s, displayLayoutPopover: a.open };
    case "OPEN_ACK_MODAL":
      return { ...s, ackModal: { open: true, alarmId: a.alarmId } };
    case "CLOSE_ACK_MODAL":
      return { ...s, ackModal: { open: false, alarmId: null } };
    case "TOGGLE_ALARM_FILTER":
      return {
        ...s,
        alarmFilters: {
          ...s.alarmFilters,
          [a.filter]: !s.alarmFilters[a.filter],
        },
      };
    default:
      return s;
  }
}

const UiContext = createContext<{
  state: UiState;
  dispatch: React.Dispatch<UiAction>;
} | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, uiInitial);
  return (
    <UiContext.Provider value={{ state, dispatch }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}

export type ChartMode = "time" | "depth";
type RangePreset = (typeof RANGE_PRESETS_QUICK)[number]["id"];

type ChartState = {
  mode: ChartMode;
  liveMode: boolean;
  rangePreset: RangePreset | null;
  manualRange: { min: number; max: number } | null;
  dataZoomSlider: boolean;
  traceVisibility: Record<string, boolean>;
  trackOrder: string[];
  trackWidths: Record<string, number>;
  trackVisibility: Record<string, boolean>;
  crosshairValue: number | null;
};

type ChartAction =
  | { type: "SET_MODE"; mode: ChartMode }
  | { type: "SET_CROSSHAIR_VALUE"; value: number | null }
  | { type: "TOGGLE_LIVE" }
  | { type: "SET_LIVE"; live: boolean }
  | { type: "SET_RANGE_PRESET"; preset: RangePreset }
  | { type: "SET_MANUAL_RANGE"; min: number; max: number }
  | { type: "TOGGLE_DATAZOOM_SLIDER" }
  | { type: "SET_DATAZOOM_SLIDER"; value: boolean }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET_ZOOM" }
  | { type: "TOGGLE_TRACE_VISIBILITY"; trace: string }
  | { type: "SET_TRACK_ORDER"; order: string[] }
  | { type: "SET_TRACK_WIDTH"; trackId: string; width: number }
  | { type: "TOGGLE_TRACK_VISIBILITY"; trackId: string }
  | { type: "RESET_TRACK_LAYOUT" };

const chartInitial: ChartState = {
  mode: "depth",
  liveMode: true,
  rangePreset: "1h",
  manualRange: null,
  dataZoomSlider: false,
  crosshairValue: null,
  traceVisibility: {
    rpm: true,
    wob: true,
    torque: true,
    spp: true,
    hkld: true,
    gamma: true,
    rop: true,
    gas: true,
    inc: true,
    azi: true,
  },
  trackOrder: TRACKS_META.map((t) => t.id),
  trackWidths: Object.fromEntries(
    TRACKS_META.map((t) => [t.id, t.defaultWidth]),
  ),
  trackVisibility: Object.fromEntries(TRACKS_META.map((t) => [t.id, true])),
};

function chartReducer(s: ChartState, a: ChartAction): ChartState {
  switch (a.type) {
    case "SET_MODE":
      return { ...s, mode: a.mode, crosshairValue: null, manualRange: null };
    case "SET_CROSSHAIR_VALUE":
      return { ...s, crosshairValue: a.value };
    case "TOGGLE_LIVE":
      return { ...s, liveMode: !s.liveMode };
    case "SET_LIVE":
      return { ...s, liveMode: a.live };
    case "SET_RANGE_PRESET":
      return { ...s, rangePreset: a.preset, liveMode: true, manualRange: null };
    case "SET_MANUAL_RANGE":
      return { ...s, manualRange: { min: a.min, max: a.max }, liveMode: false, rangePreset: null };
    case "TOGGLE_DATAZOOM_SLIDER":
      return { ...s, dataZoomSlider: !s.dataZoomSlider };
    case "SET_DATAZOOM_SLIDER":
      return { ...s, dataZoomSlider: a.value };
    case "ZOOM_IN":
      return { ...s, liveMode: false };
    case "ZOOM_OUT":
      return { ...s, liveMode: false };
    case "RESET_ZOOM":
      return { ...s, liveMode: true, rangePreset: "1h", manualRange: null };
    case "TOGGLE_TRACE_VISIBILITY":
      return {
        ...s,
        traceVisibility: {
          ...s.traceVisibility,
          [a.trace]: !s.traceVisibility[a.trace],
        },
      };
    case "SET_TRACK_ORDER":
      return { ...s, trackOrder: a.order };
    case "SET_TRACK_WIDTH":
      return { ...s, trackWidths: { ...s.trackWidths, [a.trackId]: a.width } };
    case "TOGGLE_TRACK_VISIBILITY":
      return {
        ...s,
        trackVisibility: {
          ...s.trackVisibility,
          [a.trackId]: !s.trackVisibility[a.trackId],
        },
      };
    case "RESET_TRACK_LAYOUT":
      return {
        ...s,
        trackWidths: Object.fromEntries(
          TRACKS_META.map((t) => [t.id, t.defaultWidth]),
        ),
        trackVisibility: Object.fromEntries(
          TRACKS_META.map((t) => [t.id, true]),
        ),
      };
    default:
      return s;
  }
}

const ChartContext = createContext<{
  state: ChartState;
  dispatch: React.Dispatch<ChartAction>;
} | null>(null);

export function ChartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, chartInitial);
  return (
    <ChartContext.Provider value={{ state, dispatch }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used inside ChartProvider");
  return ctx;
}

type SettingsState = {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  sampleRate: SampleRate;
  smoothing: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
};

type SettingsAction =
  | { type: "SET_THEME"; theme: Theme }
  | { type: "SET_DENSITY"; density: Density }
  | { type: "SET_FONT_SIZE"; size: FontSize }
  | { type: "SET_SAMPLE_RATE"; rate: SampleRate }
  | { type: "TOGGLE_SMOOTHING" }
  | { type: "TOGGLE_SOUND" }
  | { type: "TOGGLE_NOTIFICATIONS" };

const settingsInitial: SettingsState = {
  theme: "gruvbox",
  density: "comfortable",
  fontSize: "md",
  sampleRate: "10hz",
  smoothing: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

function settingsReducer(s: SettingsState, a: SettingsAction): SettingsState {
  switch (a.type) {
    case "SET_THEME":
      return { ...s, theme: a.theme };
    case "SET_DENSITY":
      return { ...s, density: a.density };
    case "SET_FONT_SIZE":
      return { ...s, fontSize: a.size };
    case "SET_SAMPLE_RATE":
      return { ...s, sampleRate: a.rate };
    case "TOGGLE_SMOOTHING":
      return { ...s, smoothing: !s.smoothing };
    case "TOGGLE_SOUND":
      return { ...s, soundEnabled: !s.soundEnabled };
    case "TOGGLE_NOTIFICATIONS":
      return { ...s, notificationsEnabled: !s.notificationsEnabled };
    default:
      return s;
  }
}

const SettingsContext = createContext<{
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
} | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, settingsInitial);

  // Directly update HTML attribute before children render - required for ECharts sync theme
  // eslint-disable-next-line
  document && (document.documentElement.dataset.theme = state.theme);
  // eslint-disable-next-line
  document && (document.documentElement.dataset.fontSize = state.fontSize);
  // eslint-disable-next-line
  document && (document.documentElement.dataset.density = state.density);

  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export type { Theme, Density, FontSize, SampleRate };