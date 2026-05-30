import assert from "node:assert/strict";
import test from "node:test";

import { tileFlowBars } from "../src/lib/flow-ruler.ts";
import type { TileResponse } from "../src/services/tiles-client.ts";

const T0 = Date.parse("2026-05-26T00:00:00.000Z");
const T1 = Date.parse("2026-05-26T00:05:00.000Z");

function drillTiles(bins: TileResponse["bins"]): TileResponse {
  return {
    stream: "drill",
    res: "5m",
    from: new Date(T0).toISOString(),
    to: new Date(T1).toISOString(),
    bins,
  };
}

test("tile flow bars use drill tile flow as signed delta", () => {
  const bars = tileFlowBars(
    drillTiles([
      {
        ts: new Date(T0).toISOString(),
        flow: { min: 1490, max: 1530, avg: 1520 },
      },
    ]),
    "time",
    { min: T0, max: T1 },
    1500,
  );

  assert.deepEqual(bars, [[20, T0]]);
});

test("tile flow bars can use representative depth as y axis", () => {
  const bars = tileFlowBars(
    drillTiles([
      {
        ts: new Date(T0).toISOString(),
        depth: { min: 999, max: 1001, avg: 1000 },
        flow: { min: 1480, max: 1490, avg: 1485 },
      },
    ]),
    "depth",
    { min: 990, max: 1010 },
    1500,
  );

  assert.deepEqual(bars, [[-15, 1000]]);
});

test("tile flow bars skip old tile payloads without flow", () => {
  const bars = tileFlowBars(
    drillTiles([
      {
        ts: new Date(T0).toISOString(),
        depth: { min: 999, max: 1001, avg: 1000 },
      },
    ]),
    "time",
    { min: T0, max: T1 },
    1500,
  );

  assert.deepEqual(bars, []);
});
