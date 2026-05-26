import { PRESET_TO_MINUTES } from "@/data/dashboard-static";
import type { RangePreset } from "@/store/slices/chart-slice";
import type { TileRes } from "@/services/tiles-client";

// Live ring depth (NAPKIN 2026-05-22 — Hot-ring depth). Presets wider than
// this are served by backend tiles; narrower ones by the live WebSocket ring.
const LIVE_RING_MINUTES = 60;

export function isTilePreset(preset: RangePreset | null): boolean {
  if (!preset) return false;
  return (PRESET_TO_MINUTES[preset] ?? 0) > LIVE_RING_MINUTES;
}

// Finest → coarsest. `maxSpanMin` mirrors ResolutionPicker.MaxSpan in
// Tiles.cs — pickResolution never returns a res the backend would reject
// with RES_TOO_FINE.
const RES_LADDER: ReadonlyArray<{ res: TileRes; maxSpanMin: number }> = [
  { res: "1s", maxSpanMin: 2 },
  { res: "10s", maxSpanMin: 20 },
  { res: "1m", maxSpanMin: 120 },
  { res: "5m", maxSpanMin: 720 },
  { res: "1h", maxSpanMin: 10080 },
];

// Picks the finest resolution whose MaxSpan covers `spanMinutes`. Returns
// null when the span exceeds every resolution's cap (> 7 days).
export function pickResolution(spanMinutes: number): TileRes | null {
  for (const { res, maxSpanMin } of RES_LADDER) {
    if (spanMinutes <= maxSpanMin) return res;
  }
  return null;
}
