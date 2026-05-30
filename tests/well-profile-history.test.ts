import assert from "node:assert/strict";
import test from "node:test";

import type { HistoryExtentMessage } from "../src/domain/message.types.ts";
import { CUSTOM_HISTORY_MAX_MS } from "../src/lib/history-extent.ts";
import {
  buildWellProfileHistoryRequest,
  profileDepthAxisRange,
  wellProfileHistoryRangeFromExtent,
  wellProfilePointsFromTiles,
  wellProfileTimeRangeFromPoints,
} from "../src/lib/well-profile-history.ts";
import type { TileResponse } from "../src/services/tiles-client.ts";

const MAX = Date.parse("2026-05-30T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60_000;

function extent(minTimeMs: number | null, maxTimeMs: number | null): HistoryExtentMessage {
  return {
    wellId: "ga-01",
    streams: {
      drill: { minTimeMs, maxTimeMs, minDepth: 1000, maxDepth: 1200 },
    },
    shared: {
      minTimeMs,
      maxTimeMs,
      minDepth: 1000,
      maxDepth: 1200,
      timeMode: "single",
      depthSource: "drill",
    },
    warnings: [],
  };
}

function profileTiles(): TileResponse {
  return {
    stream: "drill",
    res: "6h",
    from: new Date(MAX - DAY_MS).toISOString(),
    to: new Date(MAX).toISOString(),
    bins: [
      {
        ts: new Date(MAX - DAY_MS).toISOString(),
        depth: { min: 1000, max: 1020, avg: 1010 },
      },
      {
        ts: "not-a-date",
        depth: { min: 1100, max: 1120, avg: 1110 },
      },
      {
        ts: new Date(MAX).toISOString(),
        depth: { min: 1190, max: 1210, avg: null },
      },
    ],
  };
}

test("well profile history request uses latest capped 30d drill tiles", () => {
  const request = buildWellProfileHistoryRequest(extent(MAX - 40 * DAY_MS, MAX), 123);

  assert.ok(request);
  assert.deepEqual(request.range, {
    min: MAX - CUSTOM_HISTORY_MAX_MS,
    max: MAX,
  });
  assert.deepEqual(request.subscription, {
    subscriptionId: 123,
    spanMinutes: 43_200,
    res: "6h",
    streams: ["drill"],
  });
  assert.deepEqual(request.message, {
    messageType: "TILE_RANGE_REQUEST",
    payload: {
      subscriptionId: 123,
      fromUnixMs: MAX - CUSTOM_HISTORY_MAX_MS,
      toUnixMs: MAX,
      res: "6h",
      streams: ["drill"],
    },
  });
});

test("well profile history request rejects missing or invalid extents", () => {
  assert.equal(wellProfileHistoryRangeFromExtent(extent(null, MAX)), null);
  assert.equal(buildWellProfileHistoryRequest(extent(MAX, MAX - 1), 1), null);
});

test("well profile points come from tile depth stats in timestamp order", () => {
  assert.deepEqual(wellProfilePointsFromTiles(profileTiles()), [
    { timestamp: MAX - DAY_MS, depth: 1010 },
    { timestamp: MAX, depth: 1200 },
  ]);
});

test("well profile time and depth ranges use rendered profile points", () => {
  const points = wellProfilePointsFromTiles(profileTiles());

  assert.deepEqual(wellProfileTimeRangeFromPoints(points), {
    min: MAX - DAY_MS,
    max: MAX,
  });
  assert.deepEqual(profileDepthAxisRange(points, 5000), {
    min: 1000,
    max: 1210,
  });
});
