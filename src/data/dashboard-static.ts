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
  { id: "drill", name: "Drill", isFixed: false, defaultWidth: 268 },
  { id: "hydraulics", name: "Hydraulics", isFixed: false, defaultWidth: 268 },
  { id: "geo", name: "Geo", isFixed: false, defaultWidth: 268 },
  { id: "directional", name: "Directional", isFixed: false, defaultWidth: 268 },
] as const;

export const TRACK_RENDER_CONFIG: Record<
  string,
  { title: string; hz: string; stream: "drill" | "geo" }
> = {
  drill:       { title: "DRILL",       hz: "10 Hz", stream: "drill" },
  hydraulics:  { title: "HYDRAULICS",  hz: "10 Hz", stream: "drill" },
  geo:         { title: "GEO",         hz: "1 Hz",  stream: "geo"   },
  directional: { title: "DIRECTIONAL", hz: "1 Hz",  stream: "geo"   },
};

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
  { depth: 12500, flow: 12 },
  { depth: 12502, flow: 8 },
  { depth: 12504, flow: 15 },
  { depth: 12506, flow: 20 },
  { depth: 12508, flow: 18 },
  { depth: 12510, flow: 5 },
  { depth: 12512, flow: -3 },
  { depth: 12514, flow: -10 },
  { depth: 12516, flow: -18 },
  { depth: 12518, flow: -25 },
  { depth: 12520, flow: -30 },
  { depth: 12522, flow: -22 },
  { depth: 12524, flow: -14 },
  { depth: 12526, flow: -8 },
  { depth: 12528, flow: 2 },
  { depth: 12530, flow: 10 },
  { depth: 12532, flow: 17 },
  { depth: 12534, flow: 22 },
  { depth: 12536, flow: 28 },
  { depth: 12538, flow: 35 },
  { depth: 12540, flow: 30 },
  { depth: 12542, flow: 22 },
  { depth: 12544, flow: 14 },
  { depth: 12546, flow: 6 },
  { depth: 12548, flow: -5 },
  { depth: 12550, flow: -15 },
  { depth: 12552, flow: -28 },
  { depth: 12554, flow: -40 },
  { depth: 12556, flow: -35 },
  { depth: 12558, flow: -20 },
  { depth: 12560, flow: -10 },
  { depth: 12562, flow: 4 },
  { depth: 12564, flow: 12 },
  { depth: 12566, flow: 19 },
  { depth: 12568, flow: 24 },
  { depth: 12570, flow: 18 },
  { depth: 12572, flow: 9 },
  { depth: 12574, flow: 3 },
  { depth: 12576, flow: -6 },
  { depth: 12578, flow: -14 },
  { depth: 12580, flow: -22 },
  { depth: 12582, flow: -18 },
  { depth: 12584, flow: -9 },
  { depth: 12586, flow: 1 },
  { depth: 12588, flow: 8 },
  { depth: 12590, flow: 16 },
  { depth: 12592, flow: 23 },
  { depth: 12594, flow: 30 },
  { depth: 12596, flow: 25 },
  { depth: 12598, flow: 17 },
  { depth: 12600, flow: 10 },
] as const;

export const DEPTH_TICKS = [
  { depth: "12,500", major: true },
  { depth: "12,510", major: false },
  { depth: "12,520", major: false },
  { depth: "12,530", major: true },
  { depth: "12,540", major: false },
  { depth: "12,550", major: false },
  { depth: "12,563", major: true },
  { depth: "12,580", major: false },
] as const;

export const CURRENT_DEPTH = "12,563";

export const TIME_TICKS = [
  { time: "14:00", major: true },
  { time: "14:10", major: false },
  { time: "14:15", major: false },
  { time: "14:20", major: true },
  { time: "14:25", major: false },
  { time: "14:30", major: false },
  { time: "14:31", major: true },
  { time: "14:40", major: false },
] as const;

export const CURRENT_TIME = "14:31";

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

// ─── Unified session data ────────────────────────────────────────────────────
// Single source of truth for all chart components during UI mock-up.
// Replace with Zustand store slices once WebSocket integration is active.

// Session anchor: minute 0 of timeAxis.range maps to this wall-clock instant.
export const SESSION_START_DATE = new Date(2026, 3, 22, 0, 0, 0); // Apr 22, 2026 00:00 (local)

const POINT_COUNT = 336; // 7 days × 48 samples/day at 30-min step
const TIME_STEP_MIN = 30;
const SESSION_TIME_MAX_MIN = (POINT_COUNT - 1) * TIME_STEP_MIN; // 10050 min ≈ 7d
const SESSION_DEPTH_START_FT = 13900;
const SESSION_DEPTH_END_FT = 15200;

export const SESSION_RANGE = {
  startDate: SESSION_START_DATE,
  pointCount: POINT_COUNT,
  timeStepMin: TIME_STEP_MIN,
  timeMaxMin: SESSION_TIME_MAX_MIN,
  depthStartFt: SESSION_DEPTH_START_FT,
  depthEndFt: SESSION_DEPTH_END_FT,
};

// Base 51-point patterns — one drilling cycle (rotate → connection at idx 19-21
// → rotate → gas kick at idx 27-32 → recover). Tiled across the full session.
const BASE_RPM = [
  120, 121, 122, 119, 121, 120, 122, 121, 120, 122,
  121, 120, 119, 122, 121, 120, 122, 121, 120,   0,
    0,   0, 121, 122, 120, 119, 121, 122, 120, 119,
  121, 120, 121, 122, 120, 121, 120, 119, 121, 122,
  120, 121, 122, 120, 121, 120, 122, 121, 120, 121,
  120,
];
const BASE_WOB = [
  20.0, 20.5, 21.0, 20.2, 20.8, 21.2, 21.0, 20.5, 21.5, 21.0,
  20.3, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0, 20.5,  0.0,
   0.0,  0.0, 20.2, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0,
  20.2, 20.5, 20.8, 21.0, 20.5, 20.8, 20.5, 20.2, 20.8, 21.0,
  20.5, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0, 20.5, 20.8,
  20.1,
];
const BASE_TORQUE = [
  4.8, 4.9, 5.0, 4.8, 4.9, 5.0, 4.9, 4.8, 5.1, 5.0,
  4.9, 4.8, 5.0, 5.1, 4.9, 4.8, 5.0, 4.9, 4.8, 0.0,
  0.0, 0.0, 4.9, 5.0, 4.9, 4.8, 4.9, 5.0, 5.1, 4.9,
  4.8, 4.9, 5.0, 4.9, 4.8, 4.9, 4.8, 4.9, 5.0, 4.9,
  4.8, 4.9, 5.0, 4.9, 4.8, 4.9, 5.0, 4.9, 4.8, 4.9,
  4.9,
];
const BASE_SPP = [
  2490, 2495, 2498, 2492, 2497, 2502, 2498, 2495, 2505, 2500,
  2497, 2492, 2498, 2505, 2500, 2495, 2502, 2497, 2492,    0,
     0,    0, 2495, 2500, 2498, 2492, 2497, 2502, 2498, 2492,
  2497, 2492, 2497, 2502, 2498, 2495, 2492, 2498, 2502, 2497,
  2492, 2497, 2502, 2497, 2492, 2497, 2502, 2497, 2492, 2497,
  2497,
];
const BASE_HKLD = [
  201, 202, 201, 200, 202, 203, 201, 200, 202, 203,
  201, 200, 202, 203, 201, 200, 202, 201, 200, 215,
  218, 220, 201, 202, 201, 200, 202, 203, 201, 200,
  202, 201, 202, 203, 201, 202, 201, 200, 202, 203,
  201, 202, 203, 201, 200, 202, 203, 201, 200, 202,
  201,
];
const BASE_GAMMA = [
   47,  49,  51,  52,  53,  54,  53,  52,  51,  52,
   55,  62,  72,  83,  91,  98, 102, 106, 108, 105,
   85,  65,  52,  45,  42,  40,  38,  40,  52,  88,
   98, 108, 115, 120, 122, 118, 112, 105,  95,  82,
   72,  65,  60,  58,  57,  58,  60,  62,  65,  67,
   68,
];
const BASE_ROP = [
  22, 23, 23, 22, 22, 23, 23, 24, 24, 23,
  25, 27, 29, 31, 33, 34, 35, 33, 31,  0,
   0,  0, 22, 21, 20, 19, 20, 22, 30, 32,
  33, 34, 33, 32, 31, 30, 29, 27, 26, 24,
  23, 23, 22, 23, 24, 24, 23, 22, 23, 24,
  25,
];
const BASE_GAS = [
   6.0,  6.2,  7.0,  6.5,  7.0,  7.2,  6.8,  7.0,  7.2,  6.5,
   7.0,  7.2,  8.0,  7.5,  8.0,  7.5,  8.2,  8.0,  9.0,  8.5,
   8.0,  7.5,  7.0,  6.5,  7.0,  7.5,  8.0, 12.0, 28.0, 42.3,
  38.0, 22.0, 14.0, 10.5,  8.5,  8.2,  8.0,  7.5,  8.0,  8.2,
   8.0,  8.2,  7.5,  8.0,  8.2,  7.5,  8.0,  8.2,  7.5,  8.0,
   8.2,
];
const BASE_INC = [
  3.2, 3.2, 3.3, 3.3, 3.3, 3.4, 3.4, 3.4, 3.4, 3.5,
  3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5,
  3.5, 3.5, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
  3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
  3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
  3.4,
];
const BASE_AZI = [
  141.5, 141.6, 141.7, 141.8, 141.9, 142.0, 142.0, 142.1, 142.1, 142.2,
  142.2, 142.3, 142.3, 142.3, 142.3, 142.3, 142.2, 142.2, 142.2, 142.1,
  142.1, 142.1, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
  142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
  142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
  142.0,
];

function tile(src: readonly number[], count: number): number[] {
  return Array.from({ length: count }, (_, i) => src[i % src.length]);
}

const SESSION_TIME_POINTS: number[] = Array.from(
  { length: POINT_COUNT },
  (_, i) => i * TIME_STEP_MIN,
);

const SESSION_DEPTH_POINTS: number[] = Array.from({ length: POINT_COUNT }, (_, i) => {
  const t = i / (POINT_COUNT - 1);
  return Math.round(
    (SESSION_DEPTH_START_FT + (SESSION_DEPTH_END_FT - SESSION_DEPTH_START_FT) * t) * 10,
  ) / 10;
});

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

const sessionEndTimeOfDay = (() => {
  const m = SESSION_TIME_MAX_MIN % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(Math.floor(m % 60))}`;
})();

// Convert "minutes since SESSION_START_DATE" → wall-clock Date.
export function sessionMinuteToDate(minute: number): Date {
  return new Date(SESSION_START_DATE.getTime() + minute * 60_000);
}

// Convert wall-clock Date → "minutes since SESSION_START_DATE".
export function dateToSessionMinute(date: Date): number {
  return (date.getTime() - SESSION_START_DATE.getTime()) / 60_000;
}

// Parse a well-profile entry date like "Mar 12" → Date in 2026 (the well year).
const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
export function parseWellProfileDate(label: string): Date {
  const [mon, day] = label.split(" ");
  return new Date(2026, MONTH_INDEX[mon] ?? 0, parseInt(day, 10));
}

// Linearly interpolate depth from WELL_PROFILE_DATA at a given wall-clock date.
export function wellProfileDepthAt(date: Date): number {
  const target = date.getTime();
  const points = WELL_PROFILE_DATA.map((d) => ({
    ms: parseWellProfileDate(d.date).getTime(),
    depth: d.depth,
  }));
  if (target <= points[0].ms) return points[0].depth;
  if (target >= points[points.length - 1].ms) return points[points.length - 1].depth;
  for (let i = 1; i < points.length; i++) {
    if (target <= points[i].ms) {
      const t = (target - points[i - 1].ms) / (points[i].ms - points[i - 1].ms);
      return points[i - 1].depth + t * (points[i].depth - points[i - 1].depth);
    }
  }
  return points[points.length - 1].depth;
}

export const WELL_SESSION = {
  cursor: {
    depthFt: SESSION_DEPTH_END_FT,
    depthLabel: SESSION_DEPTH_END_FT.toLocaleString(),
    time: sessionEndTimeOfDay,
  },

  depthAxis: {
    ticks: DEPTH_TICKS,
    range: { min: SESSION_DEPTH_START_FT, max: SESSION_DEPTH_END_FT },
  },

  timeAxis: {
    ticks: TIME_TICKS,
    // minutes since SESSION_START_DATE; spans 7 days
    range: { min: 0, max: SESSION_TIME_MAX_MIN },
  },

  wellProfile: {
    data: WELL_PROFILE_DATA,
    maxDepthFt: 15200,
  },

  flow: FLOW_DATA,

  timePoints: SESSION_TIME_POINTS,
  depthPoints: SESSION_DEPTH_POINTS,

  traces: {
    drill: {
      rpm: tile(BASE_RPM, POINT_COUNT),
      wob: tile(BASE_WOB, POINT_COUNT),
      torque: tile(BASE_TORQUE, POINT_COUNT),
    },
    hydraulics: {
      spp: tile(BASE_SPP, POINT_COUNT),
      hkld: tile(BASE_HKLD, POINT_COUNT),
    },
    geo: {
      gamma: tile(BASE_GAMMA, POINT_COUNT),
      rop: tile(BASE_ROP, POINT_COUNT),
      gas: tile(BASE_GAS, POINT_COUNT),
    },
    directional: {
      inc: tile(BASE_INC, POINT_COUNT),
      azi: tile(BASE_AZI, POINT_COUNT),
    },
  },
};

// ─── Well profile date bounds ───────────────────────────────────────────
// Parsed from WELL_PROFILE_DATA for use in date pickers.
// Year 2026 matches the app's time context.

export const WELL_PROFILE_START_DATE = new Date(2026, 2, 12); // Mar 12, 2026
export const WELL_PROFILE_END_DATE = new Date(2026, 3, 28); // Apr 28, 2026
