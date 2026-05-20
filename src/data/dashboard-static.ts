export const FIELD_INFO = {
  field: "Guntur Geothermal Field",
  region: "Garut, West Java",
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

import type { Quantity } from "@/lib/units";

// Snapshot values reflect cursor state (last sample, drilling at TD).
// Values stored as canonical metric; display layer converts per unitSystem.
export const GAUGES: Array<{
  id: string;
  label: string;
  quantity: Quantity;
  status: "ok" | "warning" | "critical";
  stream: "drill" | "geo";
}> = [
  {
    id: "rpm",
    label: "RPM",
    quantity: { kind: "scalar", value: 120, unit: "rpm" },
    status: "ok" as const,
    stream: "drill",
  },
  {
    id: "wob",
    label: "WOB",
    quantity: { kind: "load", valueKN: 86.3 },
    status: "ok" as const,
    stream: "drill",
  },
  {
    id: "torque",
    label: "Torque",
    quantity: { kind: "scalar", value: 4.60, unit: "klbf·ft" },
    status: "ok" as const,
    stream: "drill",
  },
  {
    id: "spp",
    label: "SPP",
    quantity: { kind: "pressure", valueBar: 184.8 },
    status: "ok" as const,
    stream: "drill",
  },
  {
    id: "hkld",
    label: "HKLD",
    quantity: { kind: "load", valueKN: 891.0 },
    status: "ok" as const,
    stream: "drill",
  },
  {
    id: "gamma",
    label: "Gamma",
    quantity: { kind: "scalar", value: 47, unit: "gAPI" },
    status: "ok" as const,
    stream: "geo",
  },
  {
    id: "rop",
    label: "ROP",
    quantity: { kind: "rop", valueMHr: 6.6 },
    status: "ok" as const,
    stream: "geo",
  },
  {
    id: "h2s",
    label: "H2S",
    quantity: { kind: "scalar", value: 5.1, unit: "ppm" },
    status: "ok" as const,
    stream: "geo",
  },
  {
    id: "inc",
    label: "Inc",
    quantity: { kind: "scalar", value: 22.2, unit: "°" },
    status: "ok" as const,
    stream: "geo",
  },
  {
    id: "azi",
    label: "Azi",
    quantity: { kind: "scalar", value: 145, unit: "°" },
    status: "ok" as const,
    stream: "geo",
  },
];

export const TRACK_TRACES = {
  drill: [
    { trace: "rpm" as const, name: "RPM", kind: "scalar" as const, minScalar: 0, maxScalar: 200, unit: "rpm" },
    { trace: "wob" as const, name: "WOB", kind: "load" as const, minKN: 0, maxKN: 178 },
    {
      trace: "torque" as const,
      name: "TORQUE",
      kind: "scalar" as const,
      minScalar: 0,
      maxScalar: 10,
      unit: "klbf·ft",
    },
  ],
  hydraulics: [
    { trace: "spp" as const, name: "SPP", kind: "pressure" as const, minBar: 0, maxBar: 207 },
    { trace: "hkld" as const, name: "HKLD", kind: "load" as const, minKN: 0, maxKN: 1112 },
  ],
  geo: [
    { trace: "gamma" as const, name: "GR", kind: "scalar" as const, minScalar: 0, maxScalar: 150, unit: "gAPI" },
    { trace: "rop" as const, name: "ROP", kind: "rop" as const, minMHr: 0, maxMHr: 18.3 },
    { trace: "h2s" as const, name: "H2S", kind: "scalar" as const, minScalar: 0, maxScalar: 50, unit: "ppm" },
  ],
  directional: [
    { trace: "inc" as const, name: "INC", kind: "scalar" as const, minScalar: 0, maxScalar: 90, unit: "°" },
    { trace: "azi" as const, name: "AZI", kind: "scalar" as const, minScalar: 0, maxScalar: 360, unit: "°" },
  ],
} as const;

// Depths in meters MD (canonical). Render boundary converts to ft when imperial.
export const WELL_PROFILE_DATA = [
  { date: "Mar 12", depth: 0 },
  { date: "Mar 14", depth: 457 },
  { date: "Mar 17", depth: 975 },
  { date: "Mar 20", depth: 1463 },
  { date: "Mar 24", depth: 1951 },
  { date: "Mar 28", depth: 2408 },
  { date: "Apr 01", depth: 2774 },
  { date: "Apr 05", depth: 3139 },
  { date: "Apr 09", depth: 3475 },
  { date: "Apr 13", depth: 3688 },
  { date: "Apr 17", depth: 3829 },
  { date: "Apr 20", depth: 4115 },
  { date: "Apr 24", depth: 4359 },
  { date: "Apr 28", depth: 4633 },
] as const;

export const RANGE_PRESETS_QUICK = [
  { id: "1h", label: "1h" },
  { id: "6h", label: "6h" },
  { id: "12h", label: "12h" },
  { id: "24h", label: "24h" },
  { id: "3d", label: "3d" },
  { id: "7d", label: "7d" },
] as const;

// Centralised preset → minutes table. "h" = hours, "d" = days. Used by all
// chart components so the preset semantics stay consistent.
export const PRESET_TO_MINUTES: Record<string, number> = Object.fromEntries(
  RANGE_PRESETS_QUICK.map((p) => [
    p.id,
    parseInt(p.id) * (p.id.includes("d") ? 24 * 60 : 60),
  ]),
);

export const TICKER_NOMINAL_ENTRIES = [
  { label: "Well", value: "PROD-GA-01 · Pad Guntur" },
  { label: "Depth", value: "4,630 m MD" },
  { label: "ROP", value: "6.6 m/hr" },
  { label: "WHT", value: "220°C" },
  { label: "RPM", value: "120" },
  { label: "Status", value: "All systems nominal" },
] as const;

// =============================================================================
// Unified session data
// =============================================================================
// Single source of truth for all chart components during UI mock-up.
// Replace with Zustand store slices once WebSocket integration is active.

// Session anchor: minute 0 of timeAxis.range maps to this wall-clock instant.
export const SESSION_START_DATE = new Date(2026, 3, 22, 0, 0, 0); // Apr 22, 2026 00:00 (local)

const POINT_COUNT = 336; // 7 days × 48 samples/day at 30-min step
const TIME_STEP_MIN = 30;
const SESSION_TIME_MAX_MIN = (POINT_COUNT - 1) * TIME_STEP_MIN; // 10050 min ≈ 7d
const SESSION_DEPTH_START_M = 4237;
const SESSION_DEPTH_END_M = 4633;

// Stateful generator: produces depth + traces + flow per sample, modeling
// realistic drill / connect / trip / idle phases. Replaces the old "tile a
// 51-point base pattern" approach which produced monotonic depth, periodic
// connections, and decoupled flow.

const SESSION_TIME_POINTS: number[] = Array.from(
  { length: POINT_COUNT },
  (_, i) => i * TIME_STEP_MIN,
);

// Reproducible PRNG (Mulberry32). Change SESSION_SEED to regenerate variation.
const SESSION_SEED = 42;
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Phase = "drill" | "connect" | "trip_out" | "trip_in" | "idle";

// Hand-tuned 7-day operational schedule. Lengths in samples (30-min step).
// Ends in "drill" so cursor depth = current bit depth at active drilling.
// Sum must equal POINT_COUNT (336).
const PHASE_SCHEDULE: ReadonlyArray<readonly [Phase, number]> = [
  ["drill", 30],     // 15h initial drilling
  ["connect", 3],    // 90min connection
  ["drill", 38],     // 19h
  ["connect", 2],    // 60min
  ["drill", 38],     // 19h
  ["idle", 8],       // 4h waiting on weather
  ["drill", 32],     // 16h
  ["connect", 2],    // 60min
  ["drill", 47],     // 23.5h
  ["trip_out", 16],  // 8h trip out (bit change)
  ["trip_in", 16],   // 8h trip in
  ["drill", 33],     // 16.5h
  ["connect", 3],    // 90min
  ["drill", 32],     // 16h
  ["idle", 5],       // 2.5h maintenance
  ["drill", 31],     // 15.5h drilling at TD (cursor here)
];

const PHASES: Phase[] = (() => {
  const out: Phase[] = [];
  for (const [p, n] of PHASE_SCHEDULE) for (let i = 0; i < n; i++) out.push(p);
  if (out.length !== POINT_COUNT) {
    throw new Error(
      `PHASE_SCHEDULE sums to ${out.length}, expected ${POINT_COUNT}`,
    );
  }
  return out;
})();

interface SessionData {
  depth: number[];
  rpm: number[]; wob: number[]; torque: number[];
  spp: number[]; hkld: number[];
  gamma: number[]; rop: number[]; h2s: number[];
  inc: number[]; azi: number[];
  flow: number[];  // gpm differential (flow-out − flow-in), ± around 0
}

function generateSession(): SessionData {
  const rng = makeRng(SESSION_SEED);
  const j = (amp: number) => (rng() * 2 - 1) * amp;
  const r1 = (n: number) => Math.round(n * 10) / 10;

  // Calibrate per-sample drill step so cumulative drilling depth gain
  // ≈ SESSION_DEPTH_END_M − SESSION_DEPTH_START_M. Trip out/in cancel out.
  const drillSamples = PHASES.filter((p) => p === "drill").length;
  const targetGain = SESSION_DEPTH_END_M - SESSION_DEPTH_START_M;
  const avgDrillStepM = targetGain / drillSamples;

  // Trip excursion: bit pulled ~107 m (~350 ft) for change-out, then run back.
  const tripExcursionM = 107;
  const tripOutCount = PHASES.filter((p) => p === "trip_out").length;
  const tripInCount = PHASES.filter((p) => p === "trip_in").length;
  const tripOutStep = tripExcursionM / tripOutCount;
  const tripInStep = tripExcursionM / tripInCount;

  const out: SessionData = {
    depth: new Array(POINT_COUNT),
    rpm: new Array(POINT_COUNT), wob: new Array(POINT_COUNT), torque: new Array(POINT_COUNT),
    spp: new Array(POINT_COUNT), hkld: new Array(POINT_COUNT),
    gamma: new Array(POINT_COUNT), rop: new Array(POINT_COUNT), h2s: new Array(POINT_COUNT),
    inc: new Array(POINT_COUNT), azi: new Array(POINT_COUNT),
    flow: new Array(POINT_COUNT),
  };

  let curDepth = SESSION_DEPTH_START_M;
  // Survey state: INC/AZI are discrete MWD measurements taken while drilling.
  // During non-drill phases they hold the last surveyed value (no jitter).
  let lastSurveyInc = 3.0;
  let lastSurveyAzi = 141.0;

  for (let i = 0; i < POINT_COUNT; i++) {
    const phase = PHASES[i];

    // Depth evolution by phase
    if (phase === "drill") {
      // Vary per-sample ROP 60-140% of avg → chunky build, not linear.
      curDepth += avgDrillStepM * (0.6 + rng() * 0.8);
      // Clamp at TD: drilling stops once total depth is reached.
      if (curDepth > SESSION_DEPTH_END_M) curDepth = SESSION_DEPTH_END_M;
    } else if (phase === "trip_out") {
      curDepth -= tripOutStep + j(0.15);
    } else if (phase === "trip_in") {
      curDepth += tripInStep + j(0.15);
    }
    // connect / idle: depth flat
    out.depth[i] = r1(curDepth);

    // Directional profile based on current depth (m)
    // Build (start → 4313 m):    inc 3°→28°, azi 141°→145°
    // Tangent (4313-4587 m):     inc ~28-30° steady, azi ~145° (slight drift)
    // Drop/land (4587 → end):    inc 29°→22°, azi steady
    if (phase === "drill") {
      let incV: number, aziV: number;
      if (curDepth < 4313) {
        const t = Math.max(0, (curDepth - SESSION_DEPTH_START_M) / (4313 - SESSION_DEPTH_START_M));
        incV = 3 + t * 25 + j(0.3);
        aziV = 141 + t * 4 + j(0.2);
      } else if (curDepth < 4587) {
        const t = (curDepth - 4313) / (4587 - 4313);
        incV = 28.5 + Math.sin(t * Math.PI * 2) * 0.8 + j(0.4);
        aziV = 145 + Math.sin(t * Math.PI * 1.5) * 1.2 + j(0.3);
      } else {
        const t = Math.min(1, (curDepth - 4587) / (SESSION_DEPTH_END_M - 4587));
        incV = 29 - t * 7 + j(0.3);
        aziV = 145 + j(0.3);
      }
      lastSurveyInc = incV;
      lastSurveyAzi = aziV;
    }
    // Non-drill: hold last surveyed value (no new MWD shot taken).
    out.inc[i] = r1(lastSurveyInc);
    out.azi[i] = r1(lastSurveyAzi);

    // Formation gamma (depth-driven, m)
    // Two-frequency oscillation + bed-boundary step at major formation tops.
    const gammaBase = 60
      + Math.sin(curDepth * 0.036) * 28
      + Math.sin(curDepth * 0.112) * 14
      + (curDepth > 4450 && curDepth < 4496 ? 22 : 0)     // hot shale layer
      + (curDepth > 4572 ? -12 : 0);                      // clean sand below

    // Depth-aware hydraulic baselines (canonical metric):
    //  SPP grows with hole depth (longer mud column → more friction loss).
    //  HKLD grows with depth too (more drillpipe weight in tension).
    const depthDelta = curDepth - SESSION_DEPTH_START_M;
    const sppDrillBase = 172 + depthDelta * 0.034;         // ~172 → ~185 bar
    const hkldDrillBase = 823 + depthDelta * 0.191;        // ~823 → ~900 kN

    // Phase-dependent surface measurements & flow
    if (phase === "drill") {
      out.rpm[i] = Math.round(120 + j(4));
      const wobV = r1(91.2 + j(5.3));
      out.wob[i] = wobV;
      // Torque correlates with WOB (frictional reaction at bit) + slight noise.
      out.torque[i] = r1(0.22 * wobV / 4.448 + 0.4 + j(0.2));
      out.spp[i] = Math.round(sppDrillBase + j(20));
      out.hkld[i] = r1(hkldDrillBase + j(2));
      // ROP penalised by hot/shale formations (high gamma → harder drilling).
      const ropPenalty = Math.max(0, gammaBase - 60) * 0.046;
      out.rop[i] = r1(Math.max(0.6, 7.3 - ropPenalty + j(1.8)));
      out.gamma[i] = Math.round(gammaBase + j(4));
      // Drilling H2S (ppm): elevated when penetrating sulfide-bearing zone
      // (depth band, m) with low-probability spike for transient gas kicks.
      const h2sZone = curDepth > 4389 && curDepth < 4496 ? 4 : 0;
      const drillSpike = rng() < 0.03 ? 8 + rng() * 14 : 0;
      out.h2s[i] = r1(7 + h2sZone + drillSpike + j(2));
      // Flow-out − flow-in ≈ small positive (cuttings displacement, gain small).
      out.flow[i] = r1(6 + j(4));
    } else if (phase === "connect") {
      out.rpm[i] = 0; out.wob[i] = 0; out.torque[i] = 0; out.spp[i] = 0;
      // Pickup weight ≈ drill weight + bit/BHA static contribution.
      out.hkld[i] = r1(hkldDrillBase + 76 + j(1.5));
      out.rop[i] = 0;
      out.gamma[i] = Math.round(gammaBase + j(3));
      out.h2s[i] = r1(6 + j(1.5));         // residual H2S
      out.flow[i] = 0;                      // pumps off
    } else if (phase === "trip_out") {
      out.rpm[i] = 0; out.wob[i] = 0; out.torque[i] = 0; out.spp[i] = 0;
      // Trip out: HKLD scales with pipe still in hole (≈ current bit depth).
      // Heavier than drilling baseline due to running drag, then decreasing
      // as more pipe is racked at surface.
      out.hkld[i] = r1(hkldDrillBase + 156 + j(3));
      out.rop[i] = 0;
      out.gamma[i] = Math.round(gammaBase + j(3));
      // Possible swab-induced H2S influx mid-trip.
      const h2sSpike = i % 13 === 5 ? 18 + rng() * 22 : 0;
      out.h2s[i] = r1(7 + j(2) + h2sSpike);
      // Negative differential: bit pulling = swab effect, mud level dropping faster than fill.
      out.flow[i] = r1(-22 + j(8));
    } else if (phase === "trip_in") {
      out.rpm[i] = 0; out.wob[i] = 0; out.torque[i] = 0;
      // Slow circulation while tripping in (fill-up + reaming pressure).
      out.spp[i] = Math.round(55 + depthDelta * 0.003 + j(60));
      out.hkld[i] = r1(hkldDrillBase - 27 + j(3)); // lighter (fluid lubrication)
      out.rop[i] = 0;
      out.gamma[i] = Math.round(gammaBase + j(3));
      out.h2s[i] = r1(6 + j(1.5));
      // Positive differential: surge/displacement as pipe enters mud column.
      out.flow[i] = r1(16 + j(6));
    } else { // idle
      out.rpm[i] = 0; out.wob[i] = 0; out.torque[i] = 0; out.spp[i] = 0;
      out.hkld[i] = r1(hkldDrillBase + j(1));
      out.rop[i] = 0;
      out.gamma[i] = Math.round(gammaBase + j(2));
      out.h2s[i] = r1(5 + j(1));
      out.flow[i] = r1(j(3));               // tiny noise around 0
    }
  }

  return out;
}

const SESSION_DATA = generateSession();
const SESSION_DEPTH_POINTS: number[] = SESSION_DATA.depth;

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

// Cursor anchored at last sample — schedule guarantees this is during drilling.
const CURSOR_DEPTH = SESSION_DEPTH_POINTS[POINT_COUNT - 1];

export const WELL_SESSION = {
  cursor: {
    depthM: CURSOR_DEPTH,
    depthLabel: CURSOR_DEPTH.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    time: sessionEndTimeOfDay,
  },

  depthAxis: {
    range: { min: SESSION_DEPTH_START_M, max: SESSION_DEPTH_END_M },
  },

  timeAxis: {
    // minutes since SESSION_START_DATE; spans 7 days
    range: { min: 0, max: SESSION_TIME_MAX_MIN },
  },

  wellProfile: {
    data: WELL_PROFILE_DATA,
    maxDepthM: 4633,
  },

  // Per-sample flow paired with depth/time via index (length = POINT_COUNT).
  // `flow` is the flow-out − flow-in differential in gpm.
  flow: SESSION_DATA.flow.map((flow, i) => ({
    flow,
    depth: SESSION_DATA.depth[i],
    time: SESSION_TIME_POINTS[i],
  })),

  timePoints: SESSION_TIME_POINTS,
  depthPoints: SESSION_DEPTH_POINTS,

  traces: {
    drill: {
      rpm: SESSION_DATA.rpm,
      wob: SESSION_DATA.wob,
      torque: SESSION_DATA.torque,
    },
    hydraulics: {
      spp: SESSION_DATA.spp,
      hkld: SESSION_DATA.hkld,
    },
    geo: {
      gamma: SESSION_DATA.gamma,
      rop: SESSION_DATA.rop,
      h2s: SESSION_DATA.h2s,
    },
    directional: {
      inc: SESSION_DATA.inc,
      azi: SESSION_DATA.azi,
    },
  },
};

// Decomposed exports so chart/ruler components never need to import WELL_SESSION.
export const SESSION_DEPTH_RANGE = WELL_SESSION.depthAxis.range;
export const SESSION_TIME_RANGE = WELL_SESSION.timeAxis.range;
export const SESSION_CURSOR_DEPTH = WELL_SESSION.cursor.depthM;
export const WELL_PROFILE_MAX_DEPTH_M = WELL_SESSION.wellProfile.maxDepthM;
export const SESSION_FLOW_SAMPLES = WELL_SESSION.flow;

// =============================================================================
// Well profile date bounds
// =============================================================================
// Parsed from WELL_PROFILE_DATA for use in date pickers.
// Year 2026 matches the app's time context.

export const WELL_PROFILE_START_DATE = new Date(2026, 2, 12); // Mar 12, 2026
export const WELL_PROFILE_END_DATE = new Date(2026, 3, 28); // Apr 28, 2026

// Last wall-clock instant covered by the time axis (SESSION_START + max minutes).
export const SESSION_END_DATE = new Date(
  SESSION_START_DATE.getTime() + SESSION_TIME_MAX_MIN * 60_000,
);

// Cross-axis projections used by non-primary rulers: TimeRuler in depth mode
// shows the time envelope of the active depth window, and vice versa. Uses
// per-sample depth/time correspondence so non-monotonic depth (trip cycles)
// is respected — the result is a min/max envelope, not a linear remap.
export function depthRangeToTimeRange(
  dMin: number,
  dMax: number,
): { min: number; max: number } | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < SESSION_DEPTH_POINTS.length; i++) {
    const d = SESSION_DEPTH_POINTS[i];
    if (d >= dMin && d <= dMax) {
      const t = SESSION_TIME_POINTS[i];
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
  }
  return Number.isFinite(lo) && Number.isFinite(hi) && hi > lo
    ? { min: lo, max: hi }
    : null;
}

export function timeRangeToDepthRange(
  tMin: number,
  tMax: number,
): { min: number; max: number } | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < SESSION_TIME_POINTS.length; i++) {
    const t = SESSION_TIME_POINTS[i];
    if (t >= tMin && t <= tMax) {
      const d = SESSION_DEPTH_POINTS[i];
      if (d < lo) lo = d;
      if (d > hi) hi = d;
    }
  }
  return Number.isFinite(lo) && Number.isFinite(hi) && hi > lo
    ? { min: lo, max: hi }
    : null;
}

// Convert a preset id (e.g. "6h", "3d") to a depth span in meters using the well
// profile, anchored at WELL_PROFILE_END_DATE = current cursor depth. Monotonic
// in preset minutes because the well profile is monotonically increasing in
// depth.
export function presetToDepthSpanM(presetId: string | null): number {
  if (!presetId) return 30;
  const minutes = PRESET_TO_MINUTES[presetId];
  if (!minutes) return 30;
  const past = new Date(WELL_PROFILE_END_DATE.getTime() - minutes * 60_000);
  return Math.max(1, SESSION_DEPTH_END_M - wellProfileDepthAt(past));
}
