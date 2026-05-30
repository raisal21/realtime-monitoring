import {
  tileEnvelope,
  type TileRange,
  type TileResponse,
} from "@/services/tiles-client";

export type FlowBar = [number, number];
export type FlowYAxis = "time" | "depth";

export function tileFlowBars(
  tiles: TileResponse | null,
  yAxis: FlowYAxis,
  yRange: TileRange,
  baseline: number,
): FlowBar[] {
  if (!tiles) return [];
  return tileEnvelope(tiles, "flow", yAxis).line.flatMap(([flow, y]) => {
    if (y < yRange.min || y > yRange.max) return [];
    return [[flow - baseline, y] satisfies FlowBar];
  });
}
