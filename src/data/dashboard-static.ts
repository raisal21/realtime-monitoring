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

export const WELL_SESSION = {
  cursor: {
    depthFt: 12563,
    depthLabel: "12,563",
    time: "14:31",
  },

  depthAxis: {
    ticks: [
      { depth: "12,500", major: true },
      { depth: "12,510", major: false },
      { depth: "12,520", major: false },
      { depth: "12,530", major: true },
      { depth: "12,540", major: false },
      { depth: "12,550", major: false },
      { depth: "12,563", major: true },
      { depth: "12,580", major: false },
      { depth: "12,590", major: false },
      { depth: "12,600", major: true },
    ],
    range: { min: 12500, max: 12600 },
  },

  timeAxis: {
    ticks: TIME_TICKS,
    range: { min: 840, max: 880 }, // minutes since midnight: 14:00–14:40
  },

  wellProfile: {
    data: WELL_PROFILE_DATA,
    maxDepthFt: 15200,
  },

  flow: FLOW_DATA,

  // 51 time points (minutes since midnight) aligned to depthPoints.
  // Uniform 0.8 min/step (14:00–14:40) — linear to match uniform depthPoints spacing.
  timePoints: [
    840.0, 840.8, 841.6, 842.4, 843.2, 844.0, 844.8, 845.6, 846.4, 847.2,
    848.0, 848.8, 849.6, 850.4, 851.2, 852.0, 852.8, 853.6, 854.4, 855.2,
    856.0, 856.8, 857.6, 858.4, 859.2, 860.0, 860.8, 861.6, 862.4, 863.2,
    864.0, 864.8, 865.6, 866.4, 867.2, 868.0, 868.8, 869.6, 870.4, 871.2,
    872.0, 872.8, 873.6, 874.4, 875.2, 876.0, 876.8, 877.6, 878.4, 879.2,
    880.0,
  ],

  // 51 depth sample points — 12500 to 12600 ft, step 2 ft
  depthPoints: [
    12500, 12502, 12504, 12506, 12508, 12510, 12512, 12514, 12516, 12518,
    12520, 12522, 12524, 12526, 12528, 12530, 12532, 12534, 12536, 12538,
    12540, 12542, 12544, 12546, 12548, 12550, 12552, 12554, 12556, 12558,
    12560, 12562, 12564, 12566, 12568, 12570, 12572, 12574, 12576, 12578,
    12580, 12582, 12584, 12586, 12588, 12590, 12592, 12594, 12596, 12598,
    12600,
  ],

  // Trace values aligned to depthPoints (index i → depthPoints[i]).
  // 0 values at indices 19-21 (depth 12538-12542) = pipe connection.
  traces: {
    drill: {
      rpm: [
        120, 121, 122, 119, 121, 120, 122, 121, 120, 122,
        121, 120, 119, 122, 121, 120, 122, 121, 120,   0,
          0,   0, 121, 122, 120, 119, 121, 122, 120, 119,
        121, 120, 121, 122, 120, 121, 120, 119, 121, 122,
        120, 121, 122, 120, 121, 120, 122, 121, 120, 121,
        120,
      ],
      wob: [
        20.0, 20.5, 21.0, 20.2, 20.8, 21.2, 21.0, 20.5, 21.5, 21.0,
        20.3, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0, 20.5,  0.0,
         0.0,  0.0, 20.2, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0,
        20.2, 20.5, 20.8, 21.0, 20.5, 20.8, 20.5, 20.2, 20.8, 21.0,
        20.5, 20.8, 21.2, 21.0, 20.5, 20.8, 21.2, 21.0, 20.5, 20.8,
        20.1,
      ],
      torque: [
        4.8, 4.9, 5.0, 4.8, 4.9, 5.0, 4.9, 4.8, 5.1, 5.0,
        4.9, 4.8, 5.0, 5.1, 4.9, 4.8, 5.0, 4.9, 4.8, 0.0,
        0.0, 0.0, 4.9, 5.0, 4.9, 4.8, 4.9, 5.0, 5.1, 4.9,
        4.8, 4.9, 5.0, 4.9, 4.8, 4.9, 4.8, 4.9, 5.0, 4.9,
        4.8, 4.9, 5.0, 4.9, 4.8, 4.9, 5.0, 4.9, 4.8, 4.9,
        4.9,
      ],
    },

    hydraulics: {
      spp: [
        2490, 2495, 2498, 2492, 2497, 2502, 2498, 2495, 2505, 2500,
        2497, 2492, 2498, 2505, 2500, 2495, 2502, 2497, 2492,    0,
           0,    0, 2495, 2500, 2498, 2492, 2497, 2502, 2498, 2492,
        2497, 2492, 2497, 2502, 2498, 2495, 2492, 2498, 2502, 2497,
        2492, 2497, 2502, 2497, 2492, 2497, 2502, 2497, 2492, 2497,
        2497,
      ],
      // HKLD spikes at connection (indices 19-21) as string weight transfers
      hkld: [
        201, 202, 201, 200, 202, 203, 201, 200, 202, 203,
        201, 200, 202, 203, 201, 200, 202, 201, 200, 215,
        218, 220, 201, 202, 201, 200, 202, 203, 201, 200,
        202, 201, 202, 203, 201, 202, 201, 200, 202, 203,
        201, 202, 203, 201, 200, 202, 203, 201, 200, 202,
        201,
      ],
    },

    geo: {
      // GR: sandstone (low) → shale (high) → reservoir (low) → shale → transition
      gamma: [
         47,  49,  51,  52,  53,  54,  53,  52,  51,  52,
         55,  62,  72,  83,  91,  98, 102, 106, 108, 105,
         85,  65,  52,  45,  42,  40,  38,  40,  52,  88,
         98, 108, 115, 120, 122, 118, 112, 105,  95,  82,
         72,  65,  60,  58,  57,  58,  60,  62,  65,  67,
         68,
      ],
      // ROP higher in shale, lower in harder formations; 0 during connection
      rop: [
        22, 23, 23, 22, 22, 23, 23, 24, 24, 23,
        25, 27, 29, 31, 33, 34, 35, 33, 31,  0,
         0,  0, 22, 21, 20, 19, 20, 22, 30, 32,
        33, 34, 33, 32, 31, 30, 29, 27, 26, 24,
        23, 23, 22, 23, 24, 24, 23, 22, 23, 24,
        25,
      ],
      // Gas spike at 12554-12562 matches large negative flow (kick zone)
      gas: [
         6.0,  6.2,  7.0,  6.5,  7.0,  7.2,  6.8,  7.0,  7.2,  6.5,
         7.0,  7.2,  8.0,  7.5,  8.0,  7.5,  8.2,  8.0,  9.0,  8.5,
         8.0,  7.5,  7.0,  6.5,  7.0,  7.5,  8.0, 12.0, 28.0, 42.3,
        38.0, 22.0, 14.0, 10.5,  8.5,  8.2,  8.0,  7.5,  8.0,  8.2,
         8.0,  8.2,  7.5,  8.0,  8.2,  7.5,  8.0,  8.2,  7.5,  8.0,
         8.2,
      ],
    },

    directional: {
      inc: [
        3.2, 3.2, 3.3, 3.3, 3.3, 3.4, 3.4, 3.4, 3.4, 3.5,
        3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5,
        3.5, 3.5, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
        3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
        3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4,
        3.4,
      ],
      azi: [
        141.5, 141.6, 141.7, 141.8, 141.9, 142.0, 142.0, 142.1, 142.1, 142.2,
        142.2, 142.3, 142.3, 142.3, 142.3, 142.3, 142.2, 142.2, 142.2, 142.1,
        142.1, 142.1, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
        142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
        142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0, 142.0,
        142.0,
      ],
    },
   },
 } as const;

// ─── Well profile date bounds ───────────────────────────────────────────
// Parsed from WELL_PROFILE_DATA for use in date pickers.
// Year 2026 matches the app's time context.

export const WELL_PROFILE_START_DATE = new Date(2026, 2, 12); // Mar 12, 2026
export const WELL_PROFILE_END_DATE = new Date(2026, 3, 28); // Apr 28, 2026
