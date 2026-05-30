import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCustomTileRangeRequest,
  buildPresetTileSubscribe,
  MS_PER_MIN,
} from "../src/lib/tile-sync.ts";
import { pickResolution } from "../src/lib/tile-resolution.ts";

const NOW = Date.parse("2026-05-29T00:00:00.000Z");

test("pickResolution supports the 30d 6h bucket", () => {
  assert.equal(pickResolution(43_200), "6h");
  assert.equal(pickResolution(43_201), null);
});

test("preset tile sync uses live subscription requests only for wide presets", () => {
  assert.equal(buildPresetTileSubscribe("1h", 1, NOW), null);

  const request = buildPresetTileSubscribe("7d", 7, NOW);

  assert.ok(request);
  assert.deepEqual(request.subscription, {
    subscriptionId: 7,
    spanMinutes: 10_080,
    res: "1h",
    streams: ["drill", "geo"],
  });
  assert.deepEqual(request.range, {
    min: NOW - 10_080 * MS_PER_MIN,
    max: NOW,
  });
  assert.deepEqual(request.message, {
    messageType: "TILE_SUBSCRIBE",
    payload: {
      subscriptionId: 7,
      spanMinutes: 10_080,
      res: "1h",
      streams: ["drill", "geo"],
    },
  });
});

test("custom tile sync uses one-shot range requests up to 30d", () => {
  const request = buildCustomTileRangeRequest(
    { min: NOW - 30 * 24 * 60 * MS_PER_MIN, max: NOW },
    19,
  );

  assert.ok(request);
  assert.deepEqual(request.subscription, {
    subscriptionId: 19,
    spanMinutes: 43_200,
    res: "6h",
    streams: ["drill", "geo"],
  });
  assert.deepEqual(request.message, {
    messageType: "TILE_RANGE_REQUEST",
    payload: {
      subscriptionId: 19,
      fromUnixMs: NOW - 30 * 24 * 60 * MS_PER_MIN,
      toUnixMs: NOW,
      res: "6h",
      streams: ["drill", "geo"],
    },
  });
});

test("custom tile sync rejects invalid or oversized manual ranges", () => {
  assert.equal(
    buildCustomTileRangeRequest({ min: NOW, max: NOW }, 1),
    null,
  );
  assert.equal(
    buildCustomTileRangeRequest(
      { min: NOW - (30 * 24 * 60 + 1) * MS_PER_MIN, max: NOW },
      2,
    ),
    null,
  );
});
