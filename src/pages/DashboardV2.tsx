"use client";

/* ============================================================================
   RTDC — Dashboard v2
   Full refactor per PLAN.md
   ============================================================================
   Sections:
   0. Imports
   1. Static Data
   2. State Management (3 reducers + contexts)
   3. Hooks (useClock, useResizeObserver)
   4. Shell — UniversalTopbar, DashboardSubheader, Footer
   5. Left Tool Rail
   6. Chart Area — WellProfileTrack, TimeRuler, DepthRuler, FlowRuler
   7. LogTrack + TrackFooter
   8. Floating Gauge Sidebar + Collapsed Strip
   9. Floating Alarm Sidebar + Collapsed Strip
   10. Settings Popover
   11. Zoom Popover
   12. Ack Modal
   13. Keyboard Shortcuts Hook
   14. Main Dashboard Component
   ============================================================================ */

/* ============================================================================
   0. IMPORTS
   ============================================================================ */
import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
} from "react";

import {
  // Topbar
  Bell,
  Settings as SettingsIcon,
  CircleUser,
  // Subheader
  Clock,
  // Left tool rail
  Search,
  Ruler,
  // Chart
  Activity,
  // Sidebars
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  Gauge as GaugeIcon,
  X,
  // Settings popover
  Monitor,
  Database,
  BellRing,
  // Zoom popover
  ZoomIn,
  ZoomOut,
  RotateCcw,
  // Ack modal
} from "lucide-react";

import {
  // Existing components
  Button,
  Badge,
  StatusDot,
  Surface,
  ToggleGroup,
  ToggleItem,
  TraceColor,
  ValueReadout,
  FilterChip,
  FeedItem,
  CriticalBanner,
  TopbarButton,
  BreadcrumbItem,
  ConnectionStatus,
  FooterStat,
  // NEW v2 primitives
  Popover,
  PopoverTrigger,
  PopoverContent,
  Switch,
  IconButton,
  RadioCard,
  RadioCardGroup,
  LiveBadge,
  RangePresetButton,
  TrackFooterRow,
  GaugeCardCompact,
  cn,
} from "../components/components";

/* ============================================================================
   1. STATIC DATA
   ============================================================================ */

const CURRENT_WELL = {
  id: "alpha-1",
  name: "Alpha-1",
  block: "Block 7G",
  region: "Makassar Strait",
} as const;

// Gauge cards — drill metrics first, then geo (by-type implicit)
const GAUGES = [
  // Drill
  {
    id: "rpm",
    label: "RPM",
    value: "120.4",
    unit: "rpm",
    status: "ok" as const,
  },
  {
    id: "wob",
    label: "WOB",
    value: "20.1",
    unit: "klbs",
    status: "ok" as const,
  },
  {
    id: "torque",
    label: "Torque",
    value: "4.87",
    unit: "klbf·ft",
    status: "warning" as const,
  },
  {
    id: "spp",
    label: "SPP",
    value: "2,497",
    unit: "psi",
    status: "ok" as const,
  },
  {
    id: "hkld",
    label: "HKLD",
    value: "201.3",
    unit: "klbs",
    status: "ok" as const,
  },
  // Geo
  {
    id: "gamma",
    label: "Gamma",
    value: "52.1",
    unit: "gAPI",
    status: "ok" as const,
  },
  {
    id: "rop",
    label: "ROP",
    value: "24.8",
    unit: "ft/hr",
    status: "ok" as const,
  },
  {
    id: "gas",
    label: "Gas",
    value: "8.2",
    unit: "%",
    status: "critical" as const,
  },
  { id: "inc", label: "Inc", value: "3.4", unit: "°", status: "ok" as const },
  { id: "azi", label: "Azi", value: "142", unit: "°", status: "ok" as const },
] as const;

// Traces per track
const TRACK_TRACES = {
  drill: [
    { trace: "rpm" as const, name: "RPM", min: 0, max: 200, unit: "rpm" },
    { trace: "wob" as const, name: "WOB", min: 0, max: 40, unit: "klbf" },
    {
      trace: "torque" as const,
      name: "TORQUE",
      min: 0,
      max: 10,
      unit: "klbf·ft",
    },
  ],
  hydraulics: [
    { trace: "spp" as const, name: "SPP", min: 0, max: 3000, unit: "psi" },
    { trace: "hkld" as const, name: "HKLD", min: 0, max: 250, unit: "klbs" },
  ],
  geo: [
    { trace: "gamma" as const, name: "GR", min: 0, max: 150, unit: "gAPI" },
    { trace: "rop" as const, name: "ROP", min: 0, max: 60, unit: "ft/hr" },
    { trace: "gas" as const, name: "GAS", min: 0, max: 50, unit: "%" },
  ],
  directional: [
    { trace: "inc" as const, name: "INC", min: 0, max: 90, unit: "°" },
    { trace: "azi" as const, name: "AZI", min: 0, max: 360, unit: "°" },
  ],
} as const;

const FEED_ITEMS = [
  {
    id: "f1",
    severity: "critical" as const,
    state: "unacked" as const,
    message: "High Gas — 42.3% threshold exceeded",
    meta: "Stream: GEO · Sensor: Gas Total",
    timestamp: "14:31:52",
  },
  {
    id: "f2",
    severity: "warning" as const,
    state: "unacked" as const,
    message: "SPP drop — 2,450 psi (below 2,480 min)",
    meta: "Stream: DRILL · Sensor: Standpipe Pressure",
    timestamp: "14:28:17",
  },
  {
    id: "f3",
    severity: "info" as const,
    state: "acked" as const,
    message: "Connection re-established after 3s dropout",
    meta: "System · WebSocket reconnect #2",
    timestamp: "14:21:05",
  },
  {
    id: "f4",
    severity: "note" as const,
    state: "acked" as const,
    message: "Pipe change completed — back to drilling",
    meta: "Ahmad R. · Driller · ft 12,540",
    timestamp: "14:18:33",
  },
  {
    id: "f5",
    severity: "info" as const,
    state: "resolved" as const,
    message: "RPM stabilized after correction",
    meta: "Resolved · Acked by Ahmad R.",
    timestamp: "14:05:11",
  },
] as const;

// Well profile — depth over time (static)
const WELL_PROFILE_DATA = [
  { date: "Mar 12", depth: 0 },
  { date: "Mar 14", depth: 1500 },
  { date: "Mar 17", depth: 3200 },
  { date: "Mar 20", depth: 4800 },
  { date: "Mar 24", depth: 6400 },
  { date: "Mar 28", depth: 7900 },
  { date: "Apr 01", depth: 9100 },
  { date: "Apr 05", depth: 10300 },
  { date: "Apr 09", depth: 11400 },
  { date: "Apr 13", depth: 12100 },
  { date: "Apr 17", depth: 12563 }, // current
] as const;

// Flow data — discrete bars at depth intervals (kick detection visual)
const FLOW_DATA = [
  { depth: 12500, flowIn: 850, flowOut: 845 },
  { depth: 12510, flowIn: 855, flowOut: 850 },
  { depth: 12520, flowIn: 860, flowOut: 858 },
  { depth: 12530, flowIn: 855, flowOut: 870 }, // kick warning (out > in)
  { depth: 12540, flowIn: 845, flowOut: 920 }, // strong kick (out >> in)
  { depth: 12550, flowIn: 850, flowOut: 880 }, // moderate kick
  { depth: 12563, flowIn: 855, flowOut: 858 }, // current — back to normal
] as const;

const DEPTH_TICKS = [
  { depth: "12,500", pct: 0, major: true },
  { depth: "12,510", pct: 14, major: false },
  { depth: "12,520", pct: 28, major: false },
  { depth: "12,530", pct: 43, major: true },
  { depth: "12,540", pct: 57, major: false },
  { depth: "12,550", pct: 71, major: false },
  { depth: "12,563", pct: 86, major: true }, // current depth
  { depth: "12,580", pct: 100, major: false },
] as const;

const TIME_TICKS = [
  { time: "14:00", pct: 0, major: true },
  { time: "14:10", pct: 14, major: false },
  { time: "14:15", pct: 28, major: false },
  { time: "14:20", pct: 43, major: true },
  { time: "14:25", pct: 57, major: false },
  { time: "14:30", pct: 71, major: false },
  { time: "14:31", pct: 86, major: true }, // current time
  { time: "14:40", pct: 100, major: false },
] as const;

// Range presets for zoom popover
const RANGE_PRESETS_QUICK = [
  { id: "1h", label: "1h" },
  { id: "6h", label: "6h" },
  { id: "12h", label: "12h" },
  { id: "24h", label: "24h" },
  { id: "3d", label: "3d" },
  { id: "7d", label: "7d" },
] as const;

const RANGE_PRESETS_DOMAIN = [
  { id: "shift", label: "This Shift" },
  { id: "bit-run", label: "Last Bit Run" },
  { id: "connection", label: "Last Connection" },
  { id: "custom", label: "Custom Range…" },
] as const;

/* ============================================================================
   2. STATE MANAGEMENT — 3 reducers + 3 contexts
   ============================================================================ */

// ─── 2.1 UI STATE ────────────────────────────────────────────────────────────
type UiState = {
  gaugeSidebar: "open" | "closed";
  alarmSidebar: "open" | "closed";
  settingsPopover: boolean;
  zoomPopover: boolean;
  ackModal: { open: boolean; alarmId: string | null };
  alarmFilters: { critical: boolean; warning: boolean; info: boolean };
};

type UiAction =
  | { type: "TOGGLE_GAUGE_SIDEBAR" }
  | { type: "TOGGLE_ALARM_SIDEBAR" }
  | { type: "TOGGLE_BOTH_SIDEBARS" }
  | { type: "SET_SETTINGS_POPOVER"; open: boolean }
  | { type: "SET_ZOOM_POPOVER"; open: boolean }
  | { type: "OPEN_ACK_MODAL"; alarmId: string }
  | { type: "CLOSE_ACK_MODAL" }
  | { type: "TOGGLE_ALARM_FILTER"; filter: keyof UiState["alarmFilters"] };

const uiInitial: UiState = {
  gaugeSidebar: "closed", // per PLAN 3.6 default
  alarmSidebar: "open", // per PLAN 3.6 default (safety-critical)
  settingsPopover: false,
  zoomPopover: false,
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
      // If both open → both close. Otherwise open both.
      const target =
        s.gaugeSidebar === "open" && s.alarmSidebar === "open"
          ? "closed"
          : "open";
      return { ...s, gaugeSidebar: target, alarmSidebar: target };
    }
    case "SET_SETTINGS_POPOVER":
      return { ...s, settingsPopover: a.open };
    case "SET_ZOOM_POPOVER":
      return { ...s, zoomPopover: a.open };
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

function UiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, uiInitial);
  return (
    <UiContext.Provider value={{ state, dispatch }}>
      {children}
    </UiContext.Provider>
  );
}

function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}

// ─── 2.2 CHART STATE ─────────────────────────────────────────────────────────
type ChartMode = "time" | "depth";
type RangePreset =
  | (typeof RANGE_PRESETS_QUICK)[number]["id"]
  | (typeof RANGE_PRESETS_DOMAIN)[number]["id"];

type ChartState = {
  mode: ChartMode;
  liveMode: boolean;
  rangePreset: RangePreset | null;
  traceVisibility: Record<string, boolean>;
};

type ChartAction =
  | { type: "SET_MODE"; mode: ChartMode }
  | { type: "TOGGLE_LIVE" }
  | { type: "SET_LIVE"; live: boolean }
  | { type: "SET_RANGE_PRESET"; preset: RangePreset }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET_ZOOM" }
  | { type: "TOGGLE_TRACE_VISIBILITY"; trace: string };

const chartInitial: ChartState = {
  mode: "depth",
  liveMode: true,
  rangePreset: "1h",
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
};

function chartReducer(s: ChartState, a: ChartAction): ChartState {
  switch (a.type) {
    case "SET_MODE":
      return { ...s, mode: a.mode };
    case "TOGGLE_LIVE":
      return { ...s, liveMode: !s.liveMode };
    case "SET_LIVE":
      return { ...s, liveMode: a.live };
    case "SET_RANGE_PRESET":
      return { ...s, rangePreset: a.preset, liveMode: true };
    case "ZOOM_IN":
      return { ...s, liveMode: false }; // mock — would adjust range
    case "ZOOM_OUT":
      return { ...s, liveMode: false };
    case "RESET_ZOOM":
      return { ...s, liveMode: true, rangePreset: "1h" };
    case "TOGGLE_TRACE_VISIBILITY":
      return {
        ...s,
        traceVisibility: {
          ...s.traceVisibility,
          [a.trace]: !s.traceVisibility[a.trace],
        },
      };
    default:
      return s;
  }
}

const ChartContext = createContext<{
  state: ChartState;
  dispatch: React.Dispatch<ChartAction>;
} | null>(null);

function ChartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, chartInitial);
  return (
    <ChartContext.Provider value={{ state, dispatch }}>
      {children}
    </ChartContext.Provider>
  );
}

function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used inside ChartProvider");
  return ctx;
}

// ─── 2.3 SETTINGS STATE ──────────────────────────────────────────────────────
type Theme = "gruvbox" | "tomorrow" | "solarized";
type Density = "compact" | "comfortable";
type FontSize = "sm" | "md" | "lg";
type SampleRate = "10hz" | "5hz" | "1hz";

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

function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, settingsInitial);

  // Apply theme to <html data-theme>
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}

function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

/* ============================================================================
   3. HOOKS
   ============================================================================ */

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return time;
}

function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  number,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return [ref, width];
}

/* ============================================================================
   4. SHELL — UniversalTopbar, DashboardSubheader, Footer
   ============================================================================ */

// ─── 4.1 UNIVERSAL TOPBAR ─────────────────────────────────────────────────────
function UniversalTopbar() {
  const { state: ui, dispatch } = useUi();
  const unackedCritical = useMemo(
    () =>
      FEED_ITEMS.filter(
        (f) => f.state === "unacked" && f.severity === "critical",
      ).length,
    [],
  );
  const totalUnacked = useMemo(
    () => FEED_ITEMS.filter((f) => f.state === "unacked").length,
    [],
  );

  return (
    <header
      className={cn(
        "flex items-center px-4 gap-0 z-50 flex-shrink-0",
        "bg-(--theme-elevated) border-b border-(--theme-border)",
      )}
      style={{ height: 44 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 pr-4 mr-4 border-r border-(--theme-border) flex-shrink-0">
        <div
          className={cn(
            "w-7 h-7 rounded-(--radius-badge)",
            "bg-(--theme-accent) flex items-center justify-center flex-shrink-0",
            "font-['Share_Tech_Mono',monospace] text-[12px] font-bold text-(--theme-base)",
          )}
        >
          R
        </div>
        <div className="flex flex-col leading-tight">
          <span className="brand-title text-[13px] leading-none">RTDC</span>
          <span className="label-mono leading-none mt-0.5">Control Room</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <BreadcrumbItem type="link">Wells</BreadcrumbItem>
        <BreadcrumbItem type="separator">
          <ChevronRight size={11} strokeWidth={2} />
        </BreadcrumbItem>
        <BreadcrumbItem type="link">{CURRENT_WELL.name}</BreadcrumbItem>
        <BreadcrumbItem type="separator">
          <ChevronRight size={11} strokeWidth={2} />
        </BreadcrumbItem>
        <BreadcrumbItem type="current">Dashboard</BreadcrumbItem>
      </div>

      <div className="flex-1" />

      {/* Connection status */}
      <ConnectionStatus status="online" className="mr-3" />

      {/* Action buttons */}
      <div className="flex items-center gap-1 pl-3 border-l border-(--theme-border)">
        {/* Settings */}
        <TopbarButton
          title="Settings (Cmd+K)"
          aria-label="Open settings"
          onClick={() =>
            dispatch({
              type: "SET_SETTINGS_POPOVER",
              open: !ui.settingsPopover,
            })
          }
          data-settings-trigger
        >
          <SettingsIcon size={14} strokeWidth={2} />
        </TopbarButton>

        {/* Alarm bell */}
        <TopbarButton
          intent={unackedCritical > 0 ? "alarm" : "default"}
          badgeCount={totalUnacked}
          title={`${totalUnacked} unacked alarms`}
          aria-label="Alarms"
          onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
        >
          <Bell size={14} strokeWidth={2} />
        </TopbarButton>

        {/* User */}
        <TopbarButton title="User profile" aria-label="User profile">
          <CircleUser size={14} strokeWidth={2} />
        </TopbarButton>
      </div>
    </header>
  );
}

// ─── 4.2 DASHBOARD SUBHEADER ──────────────────────────────────────────────────
function DashboardSubheader() {
  const time = useClock();
  const [ref, width] = useResizeObserver<HTMLDivElement>();

  // 2-tier truncation per PLAN 3.7
  const showFullLabel = width >= 640;

  return (
    <div
      className={cn(
        "flex items-center px-4 gap-4 flex-shrink-0 z-40",
        "bg-(--theme-base) border-b border-(--theme-border)",
      )}
      style={{ height: 36 }}
    >
      {/* Well name (truncates) */}
      <div ref={ref} className="flex-1 min-w-0">
        <span
          className={cn(
            "font-['Barlow_Condensed',sans-serif] text-[13px] font-semibold tracking-[0.04em]",
            "text-(--theme-fg) block truncate",
          )}
        >
          {showFullLabel ? (
            <>
              {CURRENT_WELL.name}
              <span className="text-(--theme-fg-muted) font-normal mx-2">
                ·
              </span>
              {CURRENT_WELL.block}
              <span className="text-(--theme-fg-dim) font-normal mx-2">·</span>
              <span className="text-(--theme-fg-muted) font-normal">
                {CURRENT_WELL.region}
              </span>
            </>
          ) : (
            <>
              {CURRENT_WELL.name}
              <span className="text-(--theme-fg-muted) font-normal mx-2">
                ·
              </span>
              {CURRENT_WELL.block}
            </>
          )}
        </span>
      </div>

      {/* Live clock */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock size={11} strokeWidth={2} className="text-(--theme-fg-dim)" />
        <ValueReadout value={time} size="sm" />
        <span className="label-mono">UTC</span>
      </div>

      {/* Live depth */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pl-4 border-l border-(--theme-border)">
        <span className="label-mono">Live Depth</span>
        <ValueReadout value="12,563" unit="ft MD" size="md" status="info" />
      </div>
    </div>
  );
}

// ─── 4.3 FOOTER ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className={cn(
        "flex items-center px-4 gap-4 flex-shrink-0 z-10",
        "bg-(--theme-base) border-t border-(--theme-border)",
      )}
      style={{ height: 28 }}
    >
      {/* Version stamp */}
      <span
        className={cn(
          "font-['Share_Tech_Mono',monospace] text-[9px] tracking-[0.06em]",
          "text-(--theme-fg-dim)",
        )}
      >
        RTDC v0.2.0-alpha · {CURRENT_WELL.name} · © 2025
      </span>

      <div className="flex-1" />

      {/* Stats */}
      <FooterStat value="48 ms" label="Ping" />
      <FooterStat value="0 frames" label="Dropped" />
      <FooterStat value="—" label="Retry" />
    </footer>
  );
}

/* ============================================================================
   5. LEFT TOOL RAIL
   ============================================================================ */

function LeftToolRail() {
  const { state: chart, dispatch } = useChart();
  const { state: ui, dispatch: uiDispatch } = useUi();

  return (
    <aside
      className={cn(
        "flex flex-col gap-3 px-3 py-3 flex-shrink-0",
        "bg-(--theme-surface) border-r border-(--theme-border)",
        "z-10",
      )}
      style={{ width: 150 }}
    >
      {/* MODE — RadioCard stack */}
      <div className="flex flex-col gap-1.5">
        <span className="section-heading">Mode</span>
        <RadioCardGroup
          value={chart.mode}
          onValueChange={(v) =>
            v && dispatch({ type: "SET_MODE", mode: v as ChartMode })
          }
          className="flex flex-col gap-1.5"
        >
          <RadioCard
            value="time"
            size="sm"
            icon={<Clock size={14} strokeWidth={2} />}
            title="Time"
            subtitle="UTC ref"
          />
          <RadioCard
            value="depth"
            size="sm"
            icon={<Ruler size={14} strokeWidth={2} />}
            title="Depth"
            subtitle="ft MD ref"
          />
        </RadioCardGroup>
      </div>

      {/* ZOOM trigger */}
      <div className="flex flex-col gap-1.5">
        <span className="section-heading">Zoom</span>
        <Popover
          open={ui.zoomPopover}
          onOpenChange={(open) =>
            uiDispatch({ type: "SET_ZOOM_POPOVER", open })
          }
        >
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 cursor-pointer",
                  "bg-(--theme-elevated) border border-(--theme-border)",
                  "rounded-(--radius-badge)",
                  "hover:border-(--theme-fg-dim) hover:bg-(--theme-overlay)",
                  "transition-all duration-150 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
                  "data-[popup-open]:border-(--theme-accent) data-[popup-open]:bg-(--theme-accent-dim)",
                )}
              >
                <Search
                  size={14}
                  strokeWidth={2}
                  className="text-(--theme-fg-muted) shrink-0"
                />
                <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-(--theme-fg)">
                  Zoom
                </span>
                <span className="flex-1" />
                <LiveBadge
                  state={chart.liveMode ? "live" : "frozen"}
                  className="text-[8px] px-1 py-0"
                />
              </button>
            }
          />
          <ZoomPopoverContent />
        </Popover>
      </div>

      <div className="flex-1" />

      {/* Sidebar controls — quick toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="section-heading">Panels</span>
        <button
          type="button"
          onClick={() => uiDispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 cursor-pointer",
            "rounded-(--radius-badge) border transition-all duration-150",
            ui.gaugeSidebar === "open"
              ? "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)"
              : "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted) hover:text-(--theme-fg)",
          )}
        >
          <GaugeIcon size={12} strokeWidth={2} />
          <span className="font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em]">
            Gauges
          </span>
        </button>
        <button
          type="button"
          onClick={() => uiDispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 cursor-pointer",
            "rounded-(--radius-badge) border transition-all duration-150",
            ui.alarmSidebar === "open"
              ? "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)"
              : "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted) hover:text-(--theme-fg)",
          )}
        >
          <TriangleAlert size={12} strokeWidth={2} />
          <span className="font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em]">
            Alarms
          </span>
        </button>
      </div>
    </aside>
  );
}

/* ============================================================================
   6. CHART AREA — WellProfileTrack, TimeRuler, DepthRuler, FlowRuler
   ============================================================================ */

// ─── 6.1 WELL PROFILE TRACK (Track #0) ────────────────────────────────────────
// Static line chart: depth (Y) over date (X), turning down to the right
function WellProfileTrack() {
  // Convert data to SVG polyline — invert Y because depth grows downward
  const maxDepth = 13000;
  const points = WELL_PROFILE_DATA.map((d, i) => {
    const x = (i / (WELL_PROFILE_DATA.length - 1)) * 100;
    const y = (d.depth / maxDepth) * 100;
    return `${x},${y}`;
  }).join(" ");

  // Current position (last point)
  const last = WELL_PROFILE_DATA[WELL_PROFILE_DATA.length - 1];
  const lastY = (last.depth / maxDepth) * 100;

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 overflow-hidden",
        "bg-(--theme-surface)",
        "border-r-2 border-r-(--theme-border)", // thicker border = anchor visual
      )}
      style={{ width: 130 }}
    >
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Well Profile</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="label-mono">depth × time</span>
        </div>
      </div>

      {/* Chart body */}
      <div className="relative flex-1 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Subtle grid */}
          <defs>
            <pattern
              id="wp-grid"
              width="20"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 14"
                fill="none"
                stroke="var(--theme-border-subtle)"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#wp-grid)" />

          {/* Area fill */}
          <polygon
            points={`${points} 100,${lastY} 100,100 0,100 0,0`}
            fill="var(--theme-accent)"
            opacity="0.06"
          />

          {/* Depth line */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--theme-accent)"
            strokeWidth="0.8"
            opacity="0.85"
            vectorEffect="non-scaling-stroke"
          />

          {/* Current position dot */}
          <circle cx="100" cy={lastY} r="1.2" fill="var(--theme-accent)" />
        </svg>

        {/* Date labels */}
        <div className="absolute top-0.5 left-1 font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          {WELL_PROFILE_DATA[0].date}
        </div>
        <div className="absolute bottom-0.5 right-1 font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          {last.date}
        </div>

        {/* Current depth label */}
        <div
          className="absolute right-1 font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-accent) bg-(--theme-surface) px-1 py-px rounded-sm"
          style={{ top: `${lastY}%`, transform: "translateY(-50%)" }}
        >
          12,563
        </div>
      </div>

      {/* Footer with TD marker */}
      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-muted) tabular">
          15,200 ft
        </span>
      </div>
    </div>
  );
}

// ─── 6.2 TIME RULER ───────────────────────────────────────────────────────────
function TimeRuler({ isPrimary }: { isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 50 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading",
            isPrimary && "text-(--theme-accent)",
          )}
        >
          Time
        </span>
        <div className="label-mono">UTC</div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {TIME_TICKS.map((tick) => (
          <div
            key={tick.time}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${tick.pct}%` }}
          >
            <div
              className={cn(
                "h-px bg-(--theme-border)",
                tick.major ? "w-2.5" : "w-1.5",
              )}
            />
            {tick.major && (
              <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim) ml-1 tabular">
                {tick.time}
              </span>
            )}
          </div>
        ))}
        {/* Current time cursor */}
        <div
          className="absolute left-0 right-0 h-px bg-(--theme-accent)"
          style={{ top: "86%" }}
        />
      </div>
    </div>
  );
}

// ─── 6.3 DEPTH RULER ──────────────────────────────────────────────────────────
function DepthRuler({ isPrimary }: { isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 55 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading",
            isPrimary && "text-(--theme-accent)",
          )}
        >
          Depth
        </span>
        <div className="label-mono">ft MD</div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {DEPTH_TICKS.map((tick) => (
          <div
            key={tick.depth}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${tick.pct}%` }}
          >
            <div
              className={cn(
                "h-px bg-(--theme-border)",
                tick.major ? "w-2.5" : "w-1.5",
              )}
            />
            {tick.major && (
              <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim) ml-1 tabular">
                {tick.depth}
              </span>
            )}
          </div>
        ))}
        {/* Current depth cursor */}
        <div
          className="absolute left-0 right-0 h-px bg-(--theme-accent)"
          style={{ top: "86%" }}
        />
      </div>
    </div>
  );
}

// ─── 6.4 FLOW RULER ───────────────────────────────────────────────────────────
// Discrete bar pairs at depth intervals, with kick detection visual
function FlowRuler() {
  const KICK_THRESHOLD = 0.1;
  const maxFlow = useMemo(
    () => Math.max(...FLOW_DATA.map((d) => Math.max(d.flowIn, d.flowOut))),
    [],
  );

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 60 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Flow</span>
        <div className="flex items-center justify-between">
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-critical)">
            out
          </span>
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-info)">
            in
          </span>
        </div>
      </div>

      {/* Bar rows */}
      <div className="relative flex-1 overflow-hidden">
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-(--theme-border)" />

        {/* Bars per FLOW_DATA point */}
        {FLOW_DATA.map((d, i) => {
          const pct = (i / (FLOW_DATA.length - 1)) * 100;
          const inPct = (d.flowIn / maxFlow) * 50; // 50% = center→edge
          const outPct = (d.flowOut / maxFlow) * 50;

          const max = Math.max(d.flowIn, d.flowOut);
          const diff = Math.abs(d.flowIn - d.flowOut) / max;
          const isKick = diff > KICK_THRESHOLD;
          const outDominant = d.flowOut > d.flowIn;

          return (
            <div
              key={i}
              className="absolute left-0 right-0 h-1.5 flex items-center"
              style={{ top: `${pct}%`, transform: "translateY(-50%)" }}
            >
              {/* OUT bar (left half, growing leftward from center) */}
              <div className="absolute right-1/2 h-full">
                <div
                  className={cn(
                    "h-full bg-(--theme-critical) rounded-l-sm",
                    isKick && outDominant && "animate-flow-kick-glow",
                  )}
                  style={{ width: `${outPct * 1.5}px` }}
                />
              </div>
              {/* IN bar (right half, growing rightward from center) */}
              <div className="absolute left-1/2 h-full">
                <div
                  className={cn(
                    "h-full bg-(--theme-info) rounded-r-sm",
                    isKick && !outDominant && "animate-flow-kick-glow",
                  )}
                  style={{ width: `${inPct * 1.5}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   7. LOG TRACK + TRACK FOOTER
   ============================================================================ */

interface LogTrackProps {
  trackId: keyof typeof TRACK_TRACES;
  title: string;
  hz: string;
  stream: "drill" | "geo";
}

function LogTrack({ trackId, title, hz, stream }: LogTrackProps) {
  const { state: chart, dispatch } = useChart();
  const traces = TRACK_TRACES[trackId];

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-[160px]",
        "border-r border-(--theme-border) last:border-r-0",
        "bg-(--theme-base) overflow-hidden",
        stream === "drill"
          ? "shadow-[inset_2px_0_0_var(--theme-ok)]"
          : "shadow-[inset_2px_0_0_var(--theme-info)]",
      )}
    >
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="section-heading flex-1">{title}</span>
          <Badge intent="neutral" size="xs">
            {hz}
          </Badge>
        </div>
      </div>

      {/* Chart body — static SVG placeholder */}
      <div className="relative flex-1 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
        >
          {traces.map((t, i) => {
            const visible = chart.traceVisibility[t.trace];
            if (!visible) return null;
            // Generate fake polyline based on trace index
            const points = Array.from({ length: 20 }, (_, j) => {
              const y = (j / 19) * 200;
              const x =
                30 +
                Math.sin(j * 0.5 + i) * 25 +
                Math.cos(j * 0.3 + i * 2) * 15;
              return `${x + i * 5},${y}`;
            }).join(" ");
            return (
              <polyline
                key={t.trace}
                points={points}
                fill="none"
                stroke={`var(--trace-${t.trace})`}
                strokeWidth="1"
                opacity={0.85}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      {/* Track Footer — legend rows */}
      <div className="border-t border-(--theme-border) bg-(--theme-surface) flex-shrink-0">
        {traces.map((t) => (
          <TrackFooterRow
            key={t.trace}
            trace={t.trace}
            name={t.name}
            min={t.min}
            max={t.max}
            unit={t.unit}
            visible={chart.traceVisibility[t.trace]}
            onToggle={() =>
              dispatch({ type: "TOGGLE_TRACE_VISIBILITY", trace: t.trace })
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   8. FLOATING GAUGE SIDEBAR + COLLAPSED STRIP
   ============================================================================ */

const GAUGE_SIDEBAR_WIDTH = 240;
const ALARM_SIDEBAR_WIDTH = 300;
const STRIP_WIDTH = 32;

// ─── 8.1 GAUGE COLLAPSED STRIP ────────────────────────────────────────────────
function GaugeCollapsedStrip({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();
  // Worst status across all gauges
  const worstStatus = useMemo(() => {
    if (GAUGES.some((g) => g.status === "critical")) return "critical";
    if (GAUGES.some((g) => g.status === "warning")) return "warning";
    return "ok";
  }, []);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
      className={cn(
        "absolute top-0 bottom-0 z-30",
        "flex flex-col items-center gap-2 py-3",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "hover:bg-(--theme-elevated) transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-inset",
        "cursor-pointer",
      )}
      style={{
        width: STRIP_WIDTH,
        right: rightPosition,
        transition: "right 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      aria-label="Expand gauges sidebar"
      title="Expand gauges (Cmd+.)"
    >
      <StatusDot
        status={
          worstStatus === "critical"
            ? "critical"
            : worstStatus === "warning"
              ? "warning"
              : "ok"
        }
        size="md"
        glow
        pulse={worstStatus === "critical"}
      />
      <span className="text-vertical-rl font-['Barlow_Condensed',sans-serif] text-[10px] font-bold uppercase text-(--theme-fg-muted)">
        Gauges
      </span>
      <div className="flex-1" />
      <ChevronLeft
        size={12}
        strokeWidth={2}
        className="text-(--theme-fg-dim)"
      />
    </button>
  );
}

// ─── 8.2 GAUGE SIDEBAR (EXPANDED) ─────────────────────────────────────────────
function FloatingGaugeSidebar({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 z-30",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "flex flex-col overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.4)]",
        "animate-sidebar-slide-in-right",
      )}
      style={{
        width: GAUGE_SIDEBAR_WIDTH,
        right: rightPosition,
        transition: "right 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">Gauges</span>
        <IconButton
          intent="ghost"
          size="sm"
          onClick={() => dispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
          aria-label="Collapse gauges sidebar"
          title="Collapse (Cmd+.)"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </IconButton>
      </div>

      {/* Grid of compact gauge cards */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-2 gap-px bg-(--theme-border)">
          {GAUGES.map((g) => (
            <GaugeCardCompact
              key={g.id}
              label={g.label}
              value={g.value}
              unit={g.unit}
              status={g.status}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ============================================================================
   9. FLOATING ALARM SIDEBAR + COLLAPSED STRIP
   ============================================================================ */

// ─── 9.1 ALARM COLLAPSED STRIP ────────────────────────────────────────────────
function AlarmCollapsedStrip() {
  const { dispatch } = useUi();
  const unackedCritical = useMemo(
    () =>
      FEED_ITEMS.filter(
        (f) => f.state === "unacked" && f.severity === "critical",
      ).length,
    [],
  );
  const totalUnacked = useMemo(
    () => FEED_ITEMS.filter((f) => f.state === "unacked").length,
    [],
  );

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
      className={cn(
        "absolute top-0 bottom-0 right-0 z-30",
        "flex flex-col items-center gap-1.5 py-3",
        "border-l transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-inset",
        "cursor-pointer",
        unackedCritical > 0
          ? "bg-[color-mix(in_srgb,var(--theme-critical)_8%,var(--theme-base))] border-l-(--theme-critical)/40 hover:bg-[color-mix(in_srgb,var(--theme-critical)_15%,var(--theme-base))]"
          : "bg-(--theme-surface) border-l-(--theme-border) hover:bg-(--theme-elevated)",
      )}
      style={{ width: STRIP_WIDTH }}
      aria-label="Expand alarms sidebar"
      title="Expand alarms (Cmd+/)"
    >
      {/* Critical icon + count */}
      {unackedCritical > 0 && (
        <>
          <TriangleAlert
            size={14}
            strokeWidth={2.25}
            className="text-(--theme-critical) animate-pulse-critical"
          />
          <span className="font-['Share_Tech_Mono',monospace] text-[10px] font-bold text-(--theme-critical) tabular leading-none">
            {totalUnacked}
          </span>
        </>
      )}

      {unackedCritical === 0 && totalUnacked > 0 && (
        <span className="font-['Share_Tech_Mono',monospace] text-[10px] font-bold text-(--theme-warning) tabular leading-none">
          {totalUnacked}
        </span>
      )}

      <div className="flex-1" />

      <span className="text-vertical-rl font-['Barlow_Condensed',sans-serif] text-[10px] font-bold uppercase text-(--theme-fg-muted)">
        Alarms
      </span>
      <div className="flex-1" />
      <ChevronLeft
        size={12}
        strokeWidth={2}
        className="text-(--theme-fg-dim)"
      />
    </button>
  );
}

// ─── 9.2 ALARM SIDEBAR (EXPANDED) ─────────────────────────────────────────────
function FloatingAlarmSidebar() {
  const { state: ui, dispatch } = useUi();

  // Filter feed items per active filters
  const visibleItems = useMemo(() => {
    return FEED_ITEMS.filter((f) => {
      if (f.severity === "critical") return ui.alarmFilters.critical;
      if (f.severity === "warning") return ui.alarmFilters.warning;
      if (f.severity === "info") return ui.alarmFilters.info;
      return true; // notes always shown
    });
  }, [ui.alarmFilters]);

  const criticalUnacked = FEED_ITEMS.find(
    (f) => f.severity === "critical" && f.state === "unacked",
  );

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 right-0 z-30",
        "bg-(--theme-base) border-l border-(--theme-border)",
        "flex flex-col overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.4)]",
        "animate-sidebar-slide-in-right",
      )}
      style={{ width: ALARM_SIDEBAR_WIDTH }}
    >
      {/* Critical sticky banner */}
      {criticalUnacked && (
        <CriticalBanner
          title={criticalUnacked.message}
          subtitle={`${criticalUnacked.meta} · ${criticalUnacked.timestamp}`}
        />
      )}

      {/* Header with filters */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">Alarms & Notes</span>
        <FilterChip
          intent="critical"
          active={ui.alarmFilters.critical}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "critical" })
          }
        >
          CRIT
        </FilterChip>
        <FilterChip
          intent="warning"
          active={ui.alarmFilters.warning}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "warning" })
          }
        >
          WARN
        </FilterChip>
        <FilterChip
          intent="info"
          active={ui.alarmFilters.info}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "info" })
          }
        >
          INFO
        </FilterChip>
        <IconButton
          intent="ghost"
          size="sm"
          onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
          aria-label="Collapse alarms sidebar"
          title="Collapse (Cmd+/)"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </IconButton>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => (
          <FeedItem
            key={item.id}
            severity={item.severity}
            state={item.state}
            message={item.message}
            meta={item.meta}
            timestamp={item.timestamp}
            onAck={() => dispatch({ type: "OPEN_ACK_MODAL", alarmId: item.id })}
            onDetails={() => {}}
          />
        ))}
        {visibleItems.length === 0 && (
          <div className="px-4 py-6 text-center">
            <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-dim)">
              No alarms match current filters
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ============================================================================
   10. SETTINGS POPOVER
   ============================================================================ */

function SettingsPopoverContent() {
  const { state, dispatch } = useSettings();

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      popupClassName="w-[360px] max-h-[540px] overflow-y-auto scrollbar-thin"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-(--theme-border)">
        <SettingsIcon
          size={13}
          strokeWidth={2}
          className="text-(--theme-accent) mr-2"
        />
        <span className="font-['Barlow_Condensed',sans-serif] text-[13px] font-bold uppercase tracking-[0.08em] flex-1">
          Settings
        </span>
      </div>

      {/* DISPLAY section */}
      <div className="px-4 py-3 border-b border-(--theme-border)">
        <div className="flex items-center gap-1.5 mb-2">
          <Monitor
            size={11}
            strokeWidth={2}
            className="text-(--theme-fg-dim)"
          />
          <span className="section-heading">Display</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Theme */}
          <SettingRow label="Theme">
            <div className="flex gap-1">
              {(["gruvbox", "tomorrow", "solarized"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => dispatch({ type: "SET_THEME", theme: t })}
                  className={cn(
                    "px-2.5 py-1 rounded-(--radius-badge) border cursor-pointer transition-all duration-150",
                    "font-['Share_Tech_Mono',monospace] text-[9px] uppercase tracking-[0.1em]",
                    state.theme === t
                      ? "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)"
                      : "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted) hover:text-(--theme-fg)",
                  )}
                >
                  {t === "gruvbox" ? "GBX" : t === "tomorrow" ? "TNE" : "SOL"}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Density */}
          <SettingRow label="Density">
            <ToggleGroup
              value={state.density}
              onValueChange={(v) =>
                v && dispatch({ type: "SET_DENSITY", density: v as Density })
              }
            >
              <ToggleItem value="compact">Compact</ToggleItem>
              <ToggleItem value="comfortable">Comfort</ToggleItem>
            </ToggleGroup>
          </SettingRow>

          {/* Font Size */}
          <SettingRow label="Font Size">
            <ToggleGroup
              value={state.fontSize}
              onValueChange={(v) =>
                v && dispatch({ type: "SET_FONT_SIZE", size: v as FontSize })
              }
            >
              <ToggleItem value="sm">SM</ToggleItem>
              <ToggleItem value="md">MD</ToggleItem>
              <ToggleItem value="lg">LG</ToggleItem>
            </ToggleGroup>
          </SettingRow>
        </div>
      </div>

      {/* DATA section */}
      <div className="px-4 py-3 border-b border-(--theme-border)">
        <div className="flex items-center gap-1.5 mb-2">
          <Database
            size={11}
            strokeWidth={2}
            className="text-(--theme-fg-dim)"
          />
          <span className="section-heading">Data</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <SettingRow label="Sample Rate">
            <ToggleGroup
              value={state.sampleRate}
              onValueChange={(v) =>
                v &&
                dispatch({ type: "SET_SAMPLE_RATE", rate: v as SampleRate })
              }
            >
              <ToggleItem value="10hz">10Hz</ToggleItem>
              <ToggleItem value="5hz">5Hz</ToggleItem>
              <ToggleItem value="1hz">1Hz</ToggleItem>
            </ToggleGroup>
          </SettingRow>

          <SettingRow label="Smoothing">
            <Switch
              checked={state.smoothing}
              onCheckedChange={() => dispatch({ type: "TOGGLE_SMOOTHING" })}
            />
          </SettingRow>
        </div>
      </div>

      {/* ALERTS section */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BellRing
            size={11}
            strokeWidth={2}
            className="text-(--theme-fg-dim)"
          />
          <span className="section-heading">Alerts</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <SettingRow label="Sound">
            <Switch
              checked={state.soundEnabled}
              onCheckedChange={() => dispatch({ type: "TOGGLE_SOUND" })}
            />
          </SettingRow>

          <SettingRow label="Browser Notifications">
            <Switch
              checked={state.notificationsEnabled}
              onCheckedChange={() => dispatch({ type: "TOGGLE_NOTIFICATIONS" })}
            />
          </SettingRow>
        </div>
      </div>
    </PopoverContent>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted)">
        {label}
      </span>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ============================================================================
   11. ZOOM POPOVER
   ============================================================================ */

function ZoomPopoverContent() {
  const { state, dispatch } = useChart();

  return (
    <PopoverContent
      align="start"
      sideOffset={6}
      side="right"
      popupClassName="w-[280px]"
    >
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-(--theme-border)">
        <Search
          size={12}
          strokeWidth={2}
          className="text-(--theme-accent) mr-2"
        />
        <span className="font-['Barlow_Condensed',sans-serif] text-[12px] font-bold uppercase tracking-[0.08em] flex-1">
          Zoom & Range
        </span>
        <LiveBadge state={state.liveMode ? "live" : "frozen"} />
      </div>

      {/* QUICK presets */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Zoom To</span>
        <div className="grid grid-cols-3 gap-1.5">
          {RANGE_PRESETS_QUICK.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id}
              onClick={() =>
                dispatch({ type: "SET_RANGE_PRESET", preset: p.id })
              }
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      {/* DOMAIN presets */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Drilling Range</span>
        <div className="flex flex-col gap-1.5">
          {RANGE_PRESETS_DOMAIN.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id}
              fullWidth
              onClick={() =>
                dispatch({ type: "SET_RANGE_PRESET", preset: p.id })
              }
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      {/* MANUAL controls */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Manual</span>
        <div className="flex gap-1.5">
          <Button
            intent="secondary"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "ZOOM_IN" })}
          >
            <ZoomIn size={12} strokeWidth={2} />
            In
          </Button>
          <Button
            intent="secondary"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "ZOOM_OUT" })}
          >
            <ZoomOut size={12} strokeWidth={2} />
            Out
          </Button>
          <Button
            intent="ghost"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "RESET_ZOOM" })}
          >
            <RotateCcw size={12} strokeWidth={2} />
            Reset
          </Button>
        </div>
      </div>

      {/* MODE — Live/Frozen toggle */}
      <div className="px-3 py-2.5">
        <span className="section-heading block mb-2">Mode</span>
        <Button
          intent={state.liveMode ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => dispatch({ type: "TOGGLE_LIVE" })}
        >
          <Activity size={12} strokeWidth={2} />
          {state.liveMode ? "Following Live" : "Resume Live"}
        </Button>
      </div>
    </PopoverContent>
  );
}

/* ============================================================================
   12. ACK MODAL
   ============================================================================ */

function AckModal() {
  const { state: ui, dispatch } = useUi();
  if (!ui.ackModal.open) return null;

  const alarm = FEED_ITEMS.find((f) => f.id === ui.ackModal.alarmId);
  if (!alarm) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
      onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
    >
      <Surface
        elevation="elevated"
        outline="all"
        className="w-[400px] animate-fade-up shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-(--theme-border)">
          <TriangleAlert
            size={16}
            strokeWidth={2.25}
            className="text-(--theme-critical)"
          />
          <span className="font-['Barlow_Condensed',sans-serif] text-[14px] font-bold uppercase tracking-[0.08em] flex-1">
            Acknowledge Alarm
          </span>
          <IconButton
            intent="ghost"
            size="sm"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
            aria-label="Close modal"
          >
            <X size={13} strokeWidth={2} />
          </IconButton>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3.5">
          {/* Alarm info */}
          <div
            className={cn(
              "px-3 py-2.5 rounded-(--radius-badge)",
              "bg-[color-mix(in_srgb,var(--theme-critical)_8%,transparent)]",
              "border border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
            )}
          >
            <p className="font-['Barlow_Condensed',sans-serif] text-[13px] font-bold text-(--theme-critical) uppercase tracking-[0.04em]">
              {alarm.severity.toUpperCase()} — {alarm.message}
            </p>
            <p className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted) mt-0.5">
              {alarm.meta} · Raised at {alarm.timestamp}
            </p>
          </div>

          {/* Operator */}
          <div>
            <label className="field-label">Operator Name</label>
            <input
              type="text"
              placeholder="Enter your name…"
              className="field-input font-['Barlow',sans-serif]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="field-label">Role</label>
            <input
              type="text"
              defaultValue="Driller"
              readOnly
              className="field-input font-['Barlow',sans-serif] opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-(--theme-border)">
          <Button
            intent="ghost"
            size="md"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
          >
            Cancel (Esc)
          </Button>
          <Button
            intent="primary"
            size="md"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
          >
            Confirm ACK
          </Button>
        </div>
      </Surface>
    </div>
  );
}

/* ============================================================================
   13. KEYBOARD SHORTCUTS HOOK
   ============================================================================ */

function useKeyboardShortcuts() {
  const { dispatch: uiDispatch } = useUi();
  const { dispatch: chartDispatch } = useChart();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;

      // Esc — close active overlays
      if (e.key === "Escape") {
        uiDispatch({ type: "SET_SETTINGS_POPOVER", open: false });
        uiDispatch({ type: "SET_ZOOM_POPOVER", open: false });
        uiDispatch({ type: "CLOSE_ACK_MODAL" });
        return;
      }

      if (!cmd) {
        // [ / ] — zoom out / in
        if (e.key === "[") {
          e.preventDefault();
          chartDispatch({ type: "ZOOM_OUT" });
          return;
        }
        if (e.key === "]") {
          e.preventDefault();
          chartDispatch({ type: "ZOOM_IN" });
          return;
        }
        return;
      }

      // Cmd/Ctrl combinations
      switch (e.key) {
        case ".":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_GAUGE_SIDEBAR" });
          break;
        case "/":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_ALARM_SIDEBAR" });
          break;
        case "\\":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_BOTH_SIDEBARS" });
          break;
        case "k":
        case "K":
          e.preventDefault();
          uiDispatch({ type: "SET_SETTINGS_POPOVER", open: true });
          // Focus the trigger to anchor popover
          const trigger = document.querySelector(
            "[data-settings-trigger]",
          ) as HTMLButtonElement | null;
          trigger?.focus();
          break;
        case "l":
        case "L":
          e.preventDefault();
          chartDispatch({ type: "TOGGLE_LIVE" });
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [uiDispatch, chartDispatch]);
}

/* ============================================================================
   14. MAIN DASHBOARD
   ============================================================================ */

function DashboardInner() {
  const { state: ui } = useUi();
  const { state: chart } = useChart();
  useKeyboardShortcuts();

  // Compute floating sidebar positions per PLAN 3.4
  // Alarm: always at right: 0
  // Gauge: always anchored to alarm-left edge
  const alarmAnchor =
    ui.alarmSidebar === "open" ? ALARM_SIDEBAR_WIDTH : STRIP_WIDTH;

  return (
    <>
      {/* Trace color CSS vars */}
      <style>{`
        :root {
          --trace-rpm:    #8ec07c;
          --trace-wob:    #fabd2f;
          --trace-torque: #fe8019;
          --trace-spp:    #83a598;
          --trace-hkld:   #d65d0e;
          --trace-gamma:  #b8bb26;
          --trace-rop:    #458588;
          --trace-gas:    #fb4934;
          --trace-inc:    #d3869b;
          --trace-azi:    #8ec07c;
          --trace-depth:  #d3869b;
        }
      `}</style>

      {/* Screen guard */}
      <div className="screen-guard">
        <Monitor
          size={34}
          strokeWidth={1.5}
          className="text-(--theme-fg-dim) opacity-40"
        />
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
      </div>

      {/* App shell */}
      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{ gridTemplateRows: "44px 36px 1fr 28px" }}
      >
        <UniversalTopbar />
        <DashboardSubheader />

        {/* Main area */}
        <main className="flex overflow-hidden relative">
          <LeftToolRail />

          {/* Chart area — always reserves 64px right for strips */}
          <section
            className="flex-1 flex overflow-hidden bg-(--theme-base) relative"
            style={{ paddingRight: STRIP_WIDTH * 2 }}
          >
            <div className="flex-1 flex overflow-x-auto overflow-y-hidden no-scrollbar">
              <WellProfileTrack />
              <TimeRuler isPrimary={chart.mode === "time"} />
              <DepthRuler isPrimary={chart.mode === "depth"} />
              <FlowRuler />

              {/* 4 main log tracks */}
              <LogTrack
                trackId="drill"
                title="DRILL"
                hz="10 Hz"
                stream="drill"
              />
              <LogTrack
                trackId="hydraulics"
                title="HYDRAULICS"
                hz="10 Hz"
                stream="drill"
              />
              <LogTrack trackId="geo" title="GEO" hz="1 Hz" stream="geo" />
              <LogTrack
                trackId="directional"
                title="DIRECTIONAL"
                hz="1 Hz"
                stream="geo"
              />
            </div>
          </section>

          {/* Floating sidebars — overlay on right */}
          {ui.gaugeSidebar === "open" ? (
            <FloatingGaugeSidebar rightPosition={alarmAnchor} />
          ) : (
            <GaugeCollapsedStrip rightPosition={alarmAnchor} />
          )}

          {ui.alarmSidebar === "open" ? (
            <FloatingAlarmSidebar />
          ) : (
            <AlarmCollapsedStrip />
          )}
        </main>

        <Footer />
      </div>

      {/* Modals & Popovers */}
      <AckModal />
      <SettingsPopoverWrapper />
    </>
  );
}

// Settings popover needs anchor — wrap with Popover here
function SettingsPopoverWrapper() {
  const { state: ui, dispatch } = useUi();
  return (
    <Popover
      open={ui.settingsPopover}
      onOpenChange={(open) => dispatch({ type: "SET_SETTINGS_POPOVER", open })}
    >
      {/* Hidden anchor — actual trigger is the topbar Settings button */}
      <PopoverTrigger
        render={
          <button
            data-settings-popover-anchor
            className="absolute top-3 right-20 size-px opacity-0 pointer-events-none"
            aria-hidden="true"
            tabIndex={-1}
          />
        }
      />
      <SettingsPopoverContent />
    </Popover>
  );
}

// ─── ROOT EXPORT ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <UiProvider>
      <ChartProvider>
        <SettingsProvider>
          <DashboardInner />
        </SettingsProvider>
      </ChartProvider>
    </UiProvider>
  );
}
