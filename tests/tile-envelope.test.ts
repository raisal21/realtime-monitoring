import assert from "node:assert/strict";
import test from "node:test";
import {
  projectDepthAtTime,
  projectTimeAtDepth,
  sharedTileDepthRange,
  sharedTileDataRange,
  tileDataRange,
  tileDepthRange,
  tileDepthPoints,
  tileEnvelope,
  type TileResponse,
} from "../src/services/tiles-client.ts";

const T0 = Date.parse("2026-05-26T00:00:00.000Z");
const T1 = Date.parse("2026-05-26T00:01:00.000Z");
const T2 = Date.parse("2026-05-26T00:02:00.000Z");
const T3 = Date.parse("2026-05-26T00:03:00.000Z");

function makeTiles(
  stream: string,
  timestamps: readonly string[],
): TileResponse {
  return {
    stream,
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:03:00.000Z",
    bins: timestamps.map((ts, i) => ({
      ts,
      rpm: { min: i, max: i + 10, avg: i + 5 },
    })),
  };
}

test("tile envelope uses avg for the visible line", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:01:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        rpm: { min: 10, max: 30, avg: 21 },
      },
    ],
  };

  const env = tileEnvelope(tiles, "rpm");

  assert.deepEqual(env.min, [[10, T0]]);
  assert.deepEqual(env.max, [[30, T0]]);
  assert.deepEqual(env.line, [[21, T0]]);
});

test("tile envelope falls back when avg is missing", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:03:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        rpm: { min: 10, max: 30, avg: null },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        rpm: { min: null, max: 40, avg: null },
      },
      {
        ts: "2026-05-26T00:02:00.000Z",
        rpm: { min: 50, max: null, avg: null },
      },
    ],
  };

  const env = tileEnvelope(tiles, "rpm");

  assert.deepEqual(env.line, [
    [20, T0],
    [40, T1],
    [50, T2],
  ]);
});

test("tile envelope skips invalid timestamps", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:01:00.000Z",
    bins: [
      {
        ts: "not-a-date",
        rpm: { min: 10, max: 30, avg: 20 },
      },
      {
        ts: "2026-05-26T00:00:00.000Z",
        rpm: { min: 11, max: 31, avg: 22 },
      },
    ],
  };

  const env = tileEnvelope(tiles, "rpm");

  assert.deepEqual(env.min, [[11, T0]]);
  assert.deepEqual(env.max, [[31, T0]]);
  assert.deepEqual(env.line, [[22, T0]]);
});

test("tile data range uses valid returned bucket timestamps", () => {
  const tiles = makeTiles("drill", [
    "bad-date",
    "2026-05-26T00:02:00.000Z",
    "2026-05-26T00:00:00.000Z",
  ]);

  assert.deepEqual(tileDataRange(tiles), { min: T0, max: T2 });
});

test("shared tile range keeps requested range when both streams are empty", () => {
  const requested = { min: T0, max: T3 };
  const drill = makeTiles("drill", []);
  const geo = makeTiles("geo", ["bad-date"]);

  assert.deepEqual(sharedTileDataRange(drill, geo, requested), requested);
});

test("shared tile range uses the only non-empty stream extent", () => {
  const requested = { min: T0, max: T3 };
  const drill = makeTiles("drill", []);
  const geo = makeTiles("geo", [
    "2026-05-26T00:01:00.000Z",
    "2026-05-26T00:03:00.000Z",
  ]);

  assert.deepEqual(sharedTileDataRange(drill, geo, requested), {
    min: T1,
    max: T3,
  });
});

test("shared tile range uses stream intersection when both have data", () => {
  const requested = { min: T0, max: T3 };
  const drill = makeTiles("drill", [
    "2026-05-26T00:00:00.000Z",
    "2026-05-26T00:03:00.000Z",
  ]);
  const geo = makeTiles("geo", [
    "2026-05-26T00:01:00.000Z",
    "2026-05-26T00:02:00.000Z",
  ]);

  assert.deepEqual(sharedTileDataRange(drill, geo, requested), {
    min: T1,
    max: T2,
  });
});

test("shared tile range falls back to union when streams do not overlap", () => {
  const requested = { min: T0, max: T3 };
  const drill = makeTiles("drill", ["2026-05-26T00:00:00.000Z"]);
  const geo = makeTiles("geo", ["2026-05-26T00:03:00.000Z"]);

  assert.deepEqual(sharedTileDataRange(drill, geo, requested), {
    min: T0,
    max: T3,
  });
});

test("tile depth points use avg for projection depth", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:01:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1010, avg: 1006 },
      },
    ],
  };

  assert.deepEqual(tileDepthPoints(tiles), [{ timestamp: T0, depth: 1006 }]);
});

test("tile depth points fall back when avg is missing", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:03:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1020, avg: null },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        depth: { min: null, max: 1030, avg: null },
      },
      {
        ts: "2026-05-26T00:02:00.000Z",
        depth: { min: 1040, max: null, avg: null },
      },
    ],
  };

  assert.deepEqual(tileDepthPoints(tiles), [
    { timestamp: T0, depth: 1010 },
    { timestamp: T1, depth: 1030 },
    { timestamp: T2, depth: 1040 },
  ]);
});

test("tile depth points skip invalid timestamps and unusable depth", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:03:00.000Z",
    bins: [
      {
        ts: "bad-date",
        depth: { min: 1000, max: 1010, avg: 1005 },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        depth: { min: null, max: null, avg: null },
      },
      {
        ts: "2026-05-26T00:02:00.000Z",
        depth: { min: 1020, max: 1030, avg: 1025 },
      },
    ],
  };

  assert.deepEqual(tileDepthPoints(tiles), [{ timestamp: T2, depth: 1025 }]);
});

test("project depth at time interpolates between tile points", () => {
  const midpoint = T0 + (T2 - T0) / 2;
  const points = [
    { timestamp: T0, depth: 1000 },
    { timestamp: T2, depth: 1100 },
  ];

  assert.equal(projectDepthAtTime(points, midpoint), 1050);
});

test("project depth at time clamps outside tile point bounds", () => {
  const points = [
    { timestamp: T1, depth: 1000 },
    { timestamp: T2, depth: 1100 },
  ];

  assert.equal(projectDepthAtTime(points, T0), 1000);
  assert.equal(projectDepthAtTime(points, T3), 1100);
});

test("project depth at time returns null without usable points", () => {
  assert.equal(projectDepthAtTime([], T0), null);
  assert.equal(projectDepthAtTime([{ timestamp: T0, depth: 1000 }], Number.NaN), null);
});

test("tile depth range uses visible representative depth points", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:02:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1010, avg: 1005 },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        depth: { min: 980, max: 990, avg: 985 },
      },
      {
        ts: "bad-date",
        depth: { min: 0, max: 1, avg: 1 },
      },
    ],
  };

  assert.deepEqual(tileDepthRange(tiles), { min: 985, max: 1005 });
});

test("tile depth range uses depth representative fallbacks", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:03:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1020, avg: null },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        depth: { min: null, max: 1030, avg: null },
      },
      {
        ts: "2026-05-26T00:02:00.000Z",
        depth: { min: 1040, max: null, avg: null },
      },
    ],
  };

  assert.deepEqual(tileDepthRange(tiles), { min: 1010, max: 1040 });
});

test("tile depth range matches rendered depth envelope coverage", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:02:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1020, avg: 1010 },
        rpm: { min: 10, max: 30, avg: 21 },
      },
      {
        ts: "2026-05-26T00:01:00.000Z",
        depth: { min: 980, max: 990, avg: 985 },
        rpm: { min: 11, max: 31, avg: 22 },
      },
      {
        ts: "2026-05-26T00:02:00.000Z",
        depth: { min: 1030, max: 1040, avg: 1035 },
        rpm: { min: 12, max: 32, avg: 23 },
      },
    ],
  };

  const renderedY = tileEnvelope(tiles, "rpm", "depth").line.map(([, y]) => y);
  assert.deepEqual(tileDepthRange(tiles), {
    min: Math.min(...renderedY),
    max: Math.max(...renderedY),
  });
});

test("shared tile depth range uses drill first and falls back to geo", () => {
  const drill = makeTiles("drill", []);
  const geo: TileResponse = {
    stream: "geo",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:01:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1200, max: 1220, avg: 1210 },
      },
    ],
  };
  const drillWithDepth: TileResponse = {
    ...geo,
    stream: "drill",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1020, avg: 1010 },
      },
    ],
  };

  assert.deepEqual(sharedTileDepthRange(drill, geo), { min: 1210, max: 1210 });
  assert.deepEqual(sharedTileDepthRange(drillWithDepth, geo), { min: 1010, max: 1010 });
});

test("project time at depth interpolates and clamps", () => {
  const points = [
    { timestamp: T0, depth: 1000 },
    { timestamp: T2, depth: 1100 },
  ];

  assert.equal(projectTimeAtDepth(points, 1050), T1);
  assert.equal(projectTimeAtDepth(points, 900), T0);
  assert.equal(projectTimeAtDepth(points, 1200), T2);
  assert.equal(projectTimeAtDepth([], 1000), null);
});

test("tile envelope can use depth for y values", () => {
  const tiles: TileResponse = {
    stream: "drill",
    res: "1m",
    from: "2026-05-26T00:00:00.000Z",
    to: "2026-05-26T00:01:00.000Z",
    bins: [
      {
        ts: "2026-05-26T00:00:00.000Z",
        depth: { min: 1000, max: 1010, avg: 1006 },
        rpm: { min: 10, max: 30, avg: 21 },
      },
    ],
  };

  assert.deepEqual(tileEnvelope(tiles, "rpm", "depth").line, [[21, 1006]]);
});
