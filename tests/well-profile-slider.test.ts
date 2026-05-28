import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clampRangeToBounds,
  profileMinutesToEpochMs,
  resolveWellProfileActiveBounds,
  shouldShowWellProfileSlider,
} from "../src/lib/well-profile-slider.ts";

describe("resolveWellProfileActiveBounds", () => {
  const base = {
    rangePreset: "1h" as const,
    tileRange: { min: 1_000, max: 2_000 },
    tileDepthRange: { min: 100, max: 200 },
    sessionDepthMin: 10,
    sessionDepthMax: 20,
    sessionTimeMin: 30,
    sessionTimeMax: 40,
  };

  it("uses tileRange for time mode wide presets", () => {
    assert.deepEqual(
      resolveWellProfileActiveBounds({
        ...base,
        mode: "time",
        rangePreset: "6h",
      }),
      { min: 1_000, max: 2_000 },
    );
  });

  it("uses tileDepthRange for depth mode wide presets", () => {
    assert.deepEqual(
      resolveWellProfileActiveBounds({
        ...base,
        mode: "depth",
        rangePreset: "6h",
      }),
      { min: 100, max: 200 },
    );
  });

  it("falls back to the live session for 1h", () => {
    assert.deepEqual(
      resolveWellProfileActiveBounds({
        ...base,
        mode: "time",
      }),
      { min: 30, max: 40 },
    );
  });

  it("falls back to the live session when wide tile bounds are not ready", () => {
    assert.deepEqual(
      resolveWellProfileActiveBounds({
        ...base,
        mode: "depth",
        rangePreset: "6h",
        tileDepthRange: null,
      }),
      { min: 10, max: 20 },
    );
  });
});

describe("clampRangeToBounds", () => {
  it("clips partially overlapping drag output", () => {
    assert.deepEqual(
      clampRangeToBounds(5, 15, { min: 10, max: 20 }),
      { min: 10, max: 15 },
    );
  });

  it("returns null for empty overlap", () => {
    assert.equal(clampRangeToBounds(1, 5, { min: 10, max: 20 }), null);
  });
});

describe("profileMinutesToEpochMs", () => {
  it("anchors the last well-profile point to the active time max", () => {
    assert.deepEqual(
      profileMinutesToEpochMs([0, 30, 60], 1_000_000),
      [1_000_000 - 60 * 60_000, 1_000_000 - 30 * 60_000, 1_000_000],
    );
  });
});

describe("shouldShowWellProfileSlider", () => {
  it("shows only in time slider mode", () => {
    assert.equal(shouldShowWellProfileSlider("time", true, false), true);
    assert.equal(shouldShowWellProfileSlider("depth", true, false), false);
    assert.equal(shouldShowWellProfileSlider("time", false, false), false);
    assert.equal(shouldShowWellProfileSlider("time", true, true), false);
  });
});
