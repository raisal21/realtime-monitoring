import assert from "node:assert/strict";
import test from "node:test";

import { getViewport } from "../src/lib/chart-viewport.ts";

const baseChart = {
  rangePreset: "6h" as const,
  rulerRange: null,
  logTrackRange: null,
  tileRange: null,
  tileDepthRange: null,
};

const session = {
  min: 10,
  max: 20,
  cursor: 20,
  ropMPerMin: 1,
};

test("time viewport uses tileRange when wide tile data exists", () => {
  assert.deepEqual(
    getViewport(
      { ...baseChart, tileRange: { min: 1000, max: 2000 } },
      session,
      true,
      "time",
    ),
    { min: 1000, max: 2000 },
  );
});

test("depth viewport uses tileDepthRange when wide tile data exists", () => {
  assert.deepEqual(
    getViewport(
      { ...baseChart, tileDepthRange: { min: 1500, max: 1600 } },
      session,
      true,
      "depth",
    ),
    { min: 1500, max: 1600 },
  );
});
