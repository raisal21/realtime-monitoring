export const CURRENT_WELL = {
  id: "alpha-1",
  name: "Alpha-1",
  block: "Block 7G",
  region: "Makassar Strait",
} as const;

export const THEMES = [
  {
    id: "gruvbox" as const,
    name: "Gruvbox",
    subtitle: "Warm industrial · default",
    swatch: "#83a598",
  },
  {
    id: "tomorrow" as const,
    name: "Tomorrow Eighties",
    subtitle: "Cool retro-tech",
    swatch: "#66cccc",
  },
  {
    id: "solarized" as const,
    name: "Solarized Dark",
    subtitle: "Deep sea / submarine",
    swatch: "#2aa198",
  },
];

export const TRACKS_META = [
  {
    id: "well-profile",
    name: "Well Profile",
    isFixed: true,
    defaultWidth: 130,
  },
  { id: "drill", name: "Drill", isFixed: false, defaultWidth: 25 },
  { id: "hydraulics", name: "Hydraulics", isFixed: false, defaultWidth: 25 },
  { id: "geo", name: "Geo", isFixed: false, defaultWidth: 25 },
  { id: "directional", name: "Directional", isFixed: false, defaultWidth: 25 },
] as const;

export const GAUGES = [
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

export const TRACK_TRACES = {
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

export const FEED_ITEMS = [
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

export const WELL_PROFILE_DATA = [
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
  { date: "Apr 17", depth: 12563 },
  { date: "Apr 20", depth: 13500 },
  { date: "Apr 24", depth: 14300 },
  { date: "Apr 28", depth: 15200 },
] as const;

export const FLOW_DATA = [
  { depth: 12500, flowIn: 850, flowOut: 845 },
  { depth: 12510, flowIn: 855, flowOut: 850 },
  { depth: 12520, flowIn: 860, flowOut: 858 },
  { depth: 12530, flowIn: 855, flowOut: 870 },
  { depth: 12540, flowIn: 845, flowOut: 920 },
  { depth: 12550, flowIn: 850, flowOut: 880 },
  { depth: 12563, flowIn: 855, flowOut: 858 },
] as const;

export const DEPTH_TICKS = [
  { depth: "12,500", pct: 0, major: true },
  { depth: "12,510", pct: 14, major: false },
  { depth: "12,520", pct: 28, major: false },
  { depth: "12,530", pct: 43, major: true },
  { depth: "12,540", pct: 57, major: false },
  { depth: "12,550", pct: 71, major: false },
  { depth: "12,563", pct: 86, major: true },
  { depth: "12,580", pct: 100, major: false },
] as const;

export const TIME_TICKS = [
  { time: "14:00", pct: 0, major: true },
  { time: "14:10", pct: 14, major: false },
  { time: "14:15", pct: 28, major: false },
  { time: "14:20", pct: 43, major: true },
  { time: "14:25", pct: 57, major: false },
  { time: "14:30", pct: 71, major: false },
  { time: "14:31", pct: 86, major: true },
  { time: "14:40", pct: 100, major: false },
] as const;

export const RANGE_PRESETS_QUICK = [
  { id: "1h", label: "1h" },
  { id: "6h", label: "6h" },
  { id: "12h", label: "12h" },
  { id: "24h", label: "24h" },
  { id: "3d", label: "3d" },
  { id: "7d", label: "7d" },
] as const;

export const RANGE_PRESETS_DOMAIN = [
  { id: "shift", label: "This Shift" },
  { id: "bit-run", label: "Last Bit Run" },
  { id: "connection", label: "Last Connection" },
  { id: "custom", label: "Custom Range…" },
] as const;

export const TICKER_NOMINAL_ENTRIES = [
  { label: "Depth", value: "12,563 ft MD" },
  { label: "ROP", value: "24.8 ft/hr" },
  { label: "RPM", value: "120" },
  { label: "Well", value: "Alpha-1 · Block 7G" },
  { label: "Status", value: "All systems nominal" },
] as const;
