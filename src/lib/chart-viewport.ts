import type { ChartMode, ChartState } from "@/store/slices/chart-slice";
import { PRESET_TO_MINUTES } from "@/data/dashboard-static";

export type ViewportRange = { min: number; max: number };

export type ViewportSession = {
  min: number;
  max: number;
  cursor: number;
  ropMPerMin?: number;
};

const DEFAULT_DEPTH_SPAN_M = 30;
const MS_PER_MIN = 60_000;
const DEFAULT_PRESET_MIN = 60;

export function getViewport(
  chart: Pick<
    ChartState,
    "rangePreset" | "rulerRange" | "logTrackRange" | "tileRange"
  >,
  session: ViewportSession,
  isPrimary: boolean,
  mode: ChartMode,
): ViewportRange {
  if (chart.logTrackRange) return chart.logTrackRange;
  if (chart.rulerRange) return chart.rulerRange;
  // Tile mode: a wide preset's window comes from the fetched tile range, not
  // the live ring — and tiles bucket by time only (Layer 3, time mode).
  if (mode === "time" && chart.tileRange) return chart.tileRange;

  if (!isPrimary) {
    return { min: session.min, max: session.max };
  }

  const presetMin = chart.rangePreset
    ? PRESET_TO_MINUTES[chart.rangePreset] ?? DEFAULT_PRESET_MIN
    : DEFAULT_PRESET_MIN;

  if (mode === "depth") {
    const rop = session.ropMPerMin ?? 0.1;
    const span = Math.max(DEFAULT_DEPTH_SPAN_M, presetMin * rop);
    const start = Math.max(session.min, session.cursor - span);
    return { min: start, max: session.cursor };
  }

  const spanMs = presetMin * MS_PER_MIN;
  const end = session.cursor;
  const start = Math.max(session.min, end - spanMs);
  return { min: start, max: end };
}
