import { isTilePreset } from "@/lib/tile-resolution";
import type { ChartMode, RangePreset } from "@/store/slices/chart-slice";
import type { ViewportRange } from "@/lib/chart-viewport";

type ActiveBoundsInput = {
  mode: ChartMode;
  rangePreset: RangePreset | null;
  tileRange: ViewportRange | null;
  tileDepthRange: ViewportRange | null;
  sessionDepthMin: number;
  sessionDepthMax: number;
  sessionTimeMin: number;
  sessionTimeMax: number;
};

export function resolveWellProfileActiveBounds({
  mode,
  rangePreset,
  tileRange,
  tileDepthRange,
  sessionDepthMin,
  sessionDepthMax,
  sessionTimeMin,
  sessionTimeMax,
}: ActiveBoundsInput): ViewportRange {
  const wideTilePreset = isTilePreset(rangePreset);
  if (wideTilePreset && mode === "depth" && tileDepthRange) {
    return tileDepthRange;
  }
  if (wideTilePreset && mode === "time" && tileRange) {
    return tileRange;
  }
  return mode === "depth"
    ? { min: sessionDepthMin, max: sessionDepthMax }
    : { min: sessionTimeMin, max: sessionTimeMax };
}

export function clampRangeToBounds(
  a: number,
  b: number,
  bounds: ViewportRange,
): ViewportRange | null {
  const rawMin = Math.min(a, b);
  const rawMax = Math.max(a, b);
  const min = Math.max(bounds.min, Math.min(bounds.max, rawMin));
  const max = Math.max(bounds.min, Math.min(bounds.max, rawMax));
  return max > min ? { min, max } : null;
}

export function shouldShowWellProfileSlider(
  mode: ChartMode,
  enabled: boolean,
  liveMode: boolean,
): boolean {
  return mode === "time" && enabled && !liveMode;
}

export function profileMinutesToEpochMs(
  profileMinutes: readonly number[],
  activeTimeMax: number,
): number[] {
  const anchorMinute = profileMinutes[profileMinutes.length - 1] ?? 0;
  return profileMinutes.map(
    (minute) => activeTimeMax - (anchorMinute - minute) * 60_000,
  );
}
