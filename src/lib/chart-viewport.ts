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
    "rangePreset" | "rulerRange" | "logTrackRange" | "tileRange" | "tileDepthRange"
  >,
  session: ViewportSession,
  isPrimary: boolean,
  mode: ChartMode,
): ViewportRange {
  if (chart.logTrackRange) return chart.logTrackRange;
  if (chart.rulerRange) return chart.rulerRange;
  // Tile mode: wide presets use fetched tile ranges instead of the live ring.
  if (mode === "time" && chart.tileRange) return chart.tileRange;
  if (mode === "depth" && chart.tileDepthRange) return chart.tileDepthRange;

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
