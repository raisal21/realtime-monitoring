import assert from "node:assert/strict";
import test from "node:test";
import {
  TileFrameType,
  TileResCode,
  TileStreamCode,
} from "../src/domain/constants.ts";
import { readTileBuff } from "../src/services/binary-parser.ts";
import type { ParsedTileFrame } from "../src/services/binary-parser.ts";
import {
  mergeTileResponse,
  projectOpenTileBucket,
  type TileResponse,
  type TileStat,
} from "../src/services/tiles-client.ts";

const HEADER_BYTES = 40;
const DRILL_FULL_MASK = 0x007f;
const GEO_FULL_MASK = 0x003f;
const T0 = Date.parse("2026-05-26T00:00:00.000Z");
const T1 = Date.parse("2026-05-26T00:05:00.000Z");
const T2 = Date.parse("2026-05-26T00:10:00.000Z");
const T3 = Date.parse("2026-05-26T00:15:00.000Z");
const T1_LIVE = T1 + 60_000;
const T2_LIVE = T2 + 60_000;

if (!("localStorage" in globalThis)) {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return storage.size;
      },
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
}

type StatTriple = readonly [number, number, number];

function makeTileFrame(opts: {
  frameType: number;
  subscriptionId: number;
  streamCode: number;
  resCode: number;
  traceMask: number;
  fromUnixMs: number;
  toUnixMs: number;
  replaceFromUnixMs: number;
  bins: Array<{ tsUnixMs: number; stats: readonly StatTriple[] }>;
}): ArrayBuffer {
  const enabledCount = countBits(opts.traceMask);
  const binBytes = 8 + enabledCount * 12;
  const buffer = new ArrayBuffer(HEADER_BYTES + opts.bins.length * binBytes);
  const view = new DataView(buffer);

  view.setUint8(0, opts.frameType);
  view.setUint8(1, 1);
  view.setUint16(2, 0);
  view.setUint32(4, opts.subscriptionId);
  view.setUint8(8, opts.streamCode);
  view.setUint8(9, opts.resCode);
  view.setUint16(10, opts.traceMask);
  view.setBigInt64(12, BigInt(opts.fromUnixMs));
  view.setBigInt64(20, BigInt(opts.toUnixMs));
  view.setBigInt64(28, BigInt(opts.replaceFromUnixMs));
  view.setUint32(36, opts.bins.length);

  let offset = HEADER_BYTES;
  for (const bin of opts.bins) {
    view.setBigInt64(offset, BigInt(bin.tsUnixMs));
    offset += 8;
    for (const [min, max, avg] of bin.stats) {
      view.setFloat32(offset, min);
      view.setFloat32(offset + 4, max);
      view.setFloat32(offset + 8, avg);
      offset += 12;
    }
  }

  return buffer;
}

function countBits(mask: number): number {
  let count = 0;
  for (let bit = 0; bit < 16; bit++) {
    if ((mask & (1 << bit)) !== 0) count++;
  }
  return count;
}

function stat(value: string | TileStat | undefined): TileStat {
  assert.equal(typeof value, "object");
  return value as TileStat;
}

function makeTiles(
  timestamps: readonly number[],
  values: readonly number[],
): TileResponse {
  return {
    stream: "drill",
    res: "5m",
    from: new Date(timestamps[0] ?? T0).toISOString(),
    to: new Date(timestamps.at(-1) ?? T0).toISOString(),
    bins: timestamps.map((ts, i) => ({
      ts: new Date(ts).toISOString(),
      rpm: { min: values[i], max: values[i], avg: values[i] },
    })),
  };
}

function makeDepthTiles(
  timestamps: readonly number[],
  values: readonly number[],
): TileResponse {
  return {
    stream: "drill",
    res: "6h",
    from: new Date(timestamps[0] ?? T0).toISOString(),
    to: new Date(timestamps.at(-1) ?? T0).toISOString(),
    bins: timestamps.map((ts, i) => ({
      ts: new Date(ts).toISOString(),
      depth: { min: values[i], max: values[i], avg: values[i] },
    })),
  };
}

function makeParsedFrame(opts: {
  kind: "snapshot" | "update";
  subscriptionId: number;
  stream: "drill" | "geo";
  tiles: TileResponse;
  fromUnixMs: number;
  toUnixMs: number;
  replaceFromUnixMs: number;
}): ParsedTileFrame {
  return {
    frameType:
      opts.kind === "snapshot" ? TileFrameType.SNAPSHOT : TileFrameType.UPDATE,
    kind: opts.kind,
    subscriptionId: opts.subscriptionId,
    stream: opts.stream,
    res: "5m",
    traceMask: opts.stream === "drill" ? DRILL_FULL_MASK : GEO_FULL_MASK,
    fromUnixMs: opts.fromUnixMs,
    toUnixMs: opts.toUnixMs,
    replaceFromUnixMs: opts.replaceFromUnixMs,
    tiles: opts.tiles,
  };
}

test("tile parser decodes big-endian snapshot header and NaN stats", () => {
  const frame = makeTileFrame({
    frameType: TileFrameType.SNAPSHOT,
    subscriptionId: 0x01020304,
    streamCode: TileStreamCode.DRILL,
    resCode: TileResCode["5m"],
    traceMask: DRILL_FULL_MASK,
    fromUnixMs: T0,
    toUnixMs: T2,
    replaceFromUnixMs: T0,
    bins: [
      {
        tsUnixMs: T1,
        stats: [
          [1000, 1010, Number.NaN],
          [90, 110, 100],
          [10, 20, 15],
          [1, 2, 1.5],
          [200, 210, 205],
          [3000, 3100, 3050],
          [1400, 1600, 1500],
        ],
      },
    ],
  });

  const parsed = readTileBuff(frame);

  assert.ok(parsed);
  assert.equal(parsed.kind, "snapshot");
  assert.equal(parsed.subscriptionId, 0x01020304);
  assert.equal(parsed.stream, "drill");
  assert.equal(parsed.res, "5m");
  assert.equal(parsed.traceMask, DRILL_FULL_MASK);
  assert.equal(parsed.fromUnixMs, T0);
  assert.equal(parsed.toUnixMs, T2);
  assert.equal(parsed.replaceFromUnixMs, T0);
  assert.equal(parsed.tiles.bins[0].ts, new Date(T1).toISOString());
  assert.equal(stat(parsed.tiles.bins[0].depth).avg, null);
  assert.equal(stat(parsed.tiles.bins[0].rpm).avg, 100);
  assert.equal(stat(parsed.tiles.bins[0].flow).avg, 1500);
});

test("tile parser honors trace masks and update frame type", () => {
  const mask = 0b000101;
  const frame = makeTileFrame({
    frameType: TileFrameType.UPDATE,
    subscriptionId: 7,
    streamCode: TileStreamCode.GEO,
    resCode: TileResCode["1h"],
    traceMask: mask,
    fromUnixMs: T0,
    toUnixMs: T3,
    replaceFromUnixMs: T2,
    bins: [
      {
        tsUnixMs: T2,
        stats: [
          [1000, 1002, 1001],
          [30, 40, 35],
        ],
      },
    ],
  });

  const parsed = readTileBuff(frame);

  assert.ok(parsed);
  assert.equal(parsed.kind, "update");
  assert.equal(parsed.stream, "geo");
  assert.equal(parsed.res, "1h");
  assert.equal(stat(parsed.tiles.bins[0].depth).avg, 1001);
  assert.equal(parsed.tiles.bins[0].gamma, undefined);
  assert.equal(stat(parsed.tiles.bins[0].rop).avg, 35);
});

test("tile parser decodes 6h manual-range snapshot frames", () => {
  const frame = makeTileFrame({
    frameType: TileFrameType.SNAPSHOT,
    subscriptionId: 30,
    streamCode: TileStreamCode.DRILL,
    resCode: TileResCode["6h"],
    traceMask: DRILL_FULL_MASK,
    fromUnixMs: T0,
    toUnixMs: T3,
    replaceFromUnixMs: T0,
    bins: [
      {
        tsUnixMs: T0,
        stats: Array.from({ length: 7 }, () => [1, 2, 3] as const),
      },
    ],
  });

  const parsed = readTileBuff(frame);

  assert.ok(parsed);
  assert.equal(parsed.res, "6h");
  assert.equal(parsed.subscriptionId, 30);
  assert.equal(stat(parsed.tiles.bins[0].flow).avg, 3);
});

test("tile parser rejects frame-size mismatches", () => {
  const frame = makeTileFrame({
    frameType: TileFrameType.SNAPSHOT,
    subscriptionId: 1,
    streamCode: TileStreamCode.DRILL,
    resCode: TileResCode["5m"],
    traceMask: DRILL_FULL_MASK,
    fromUnixMs: T0,
    toUnixMs: T1,
    replaceFromUnixMs: T0,
    bins: [
      {
        tsUnixMs: T0,
        stats: Array.from({ length: 7 }, () => [1, 2, 3] as const),
      },
    ],
  });

  assert.equal(readTileBuff(frame.slice(0, frame.byteLength - 1)), null);
});

test("tile parser rejects masks beyond the stream trace count", () => {
  const frame = makeTileFrame({
    frameType: TileFrameType.SNAPSHOT,
    subscriptionId: 1,
    streamCode: TileStreamCode.GEO,
    resCode: TileResCode["5m"],
    traceMask: 0x0040,
    fromUnixMs: T0,
    toUnixMs: T1,
    replaceFromUnixMs: T0,
    bins: [
      {
        tsUnixMs: T0,
        stats: [[1, 2, 3]],
      },
    ],
  });

  assert.equal(readTileBuff(frame), null);
});

test("tile merge replaces the previous and current tail buckets", () => {
  const current = makeTiles([T0, T1, T2], [0, 1, 2]);
  const incoming = makeTiles([T1, T2, T3], [10, 20, 30]);

  const merged = mergeTileResponse(current, incoming, T1);

  assert.deepEqual(
    merged.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T1, 10],
      [T2, 20],
      [T3, 30],
    ],
  );
});

test("tile merge sorts and dedupes incoming buckets by timestamp", () => {
  const current = makeTiles([T0], [0]);
  const incoming = makeTiles([T3, T2, T3], [3, 2, 33]);

  const merged = mergeTileResponse(current, incoming, T2);

  assert.deepEqual(
    merged.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T2, 2],
      [T3, 33],
    ],
  );
});

test("open tile bucket projects to the live frame tail", () => {
  const projected = projectOpenTileBucket(makeTiles([T0, T1], [0, 1]), T1_LIVE);

  assert.deepEqual(
    projected.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T1_LIVE, 1],
    ],
  );
});

test("stale tile buckets are not projected to live now", () => {
  const projected = projectOpenTileBucket(makeTiles([T0, T1], [0, 1]), T3);

  assert.deepEqual(
    projected.bins.map((bin) => Date.parse(bin.ts)),
    [T0, T1],
  );
});

test("tile store ignores stale subscription frames and merges active updates", async () => {
  const { globalRigStore } = await import("../src/store/index-store.ts");
  const store = globalRigStore.getState();
  store.resetChart();
  store.setTileSubscription(
    {
      subscriptionId: 42,
      spanMinutes: 360,
      res: "5m",
      streams: ["drill", "geo"],
    },
    { min: T0, max: T3 },
  );

  store.applyTileSnapshot(
    makeParsedFrame({
      kind: "snapshot",
      subscriptionId: 41,
      stream: "drill",
      tiles: makeTiles([T0], [1]),
      fromUnixMs: T0,
      toUnixMs: T1,
      replaceFromUnixMs: T0,
    }),
  );
  assert.equal(globalRigStore.getState().chart.drillTiles, null);

  store.applyTileSnapshot(
    makeParsedFrame({
      kind: "snapshot",
      subscriptionId: 42,
      stream: "drill",
      tiles: makeTiles([T0, T1], [0, 1]),
      fromUnixMs: T0 - 60_000,
      toUnixMs: T1_LIVE,
      replaceFromUnixMs: T0,
    }),
  );
  assert.deepEqual(globalRigStore.getState().chart.tileRange, {
    min: T0,
    max: T1_LIVE,
  });

  store.applyTileUpdate(
    makeParsedFrame({
      kind: "update",
      subscriptionId: 41,
      stream: "drill",
      tiles: makeTiles([T1, T2], [11, 22]),
      fromUnixMs: T0,
      toUnixMs: T2_LIVE,
      replaceFromUnixMs: T1,
    }),
  );
  assert.deepEqual(
    globalRigStore
      .getState()
      .chart.drillTiles?.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T1_LIVE, 1],
    ],
  );

  store.applyTileUpdate(
    makeParsedFrame({
      kind: "update",
      subscriptionId: 42,
      stream: "drill",
      tiles: makeTiles([T1, T2], [11, 22]),
      fromUnixMs: T0,
      toUnixMs: T2_LIVE,
      replaceFromUnixMs: T1,
    }),
  );

  assert.deepEqual(
    globalRigStore
      .getState()
      .chart.drillTiles?.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T1, 11],
      [T2_LIVE, 22],
    ],
  );
  assert.deepEqual(globalRigStore.getState().chart.tileRange, {
    min: T0,
    max: T2_LIVE,
  });
});

test("tile store marks manual time ruler ranges as custom tile requests", async () => {
  const { globalRigStore } = await import("../src/store/index-store.ts");
  const store = globalRigStore.getState();
  store.resetChart();

  store.setMode("time");
  store.setRulerRange(T0, T3);
  assert.deepEqual(globalRigStore.getState().chart.customTileRange, {
    min: T0,
    max: T3,
  });

  store.setRangePreset("7d");
  assert.equal(globalRigStore.getState().chart.customTileRange, null);

  store.setMode("depth");
  store.setRulerRange(1000, 1100);
  assert.equal(globalRigStore.getState().chart.customTileRange, null);
});

test("tile store routes well profile snapshots without replacing chart tiles", async () => {
  const { globalRigStore } = await import("../src/store/index-store.ts");
  const store = globalRigStore.getState();
  store.resetChart();
  store.setTileSubscription(
    {
      subscriptionId: 42,
      spanMinutes: 360,
      res: "5m",
      streams: ["drill", "geo"],
    },
    { min: T0, max: T3 },
  );
  store.setWellProfileHistoryRequest(1_000_000_001, { min: T0, max: T3 });

  store.applyTileSnapshot(
    makeParsedFrame({
      kind: "snapshot",
      subscriptionId: 42,
      stream: "drill",
      tiles: makeTiles([T0, T1], [0, 1]),
      fromUnixMs: T0,
      toUnixMs: T1,
      replaceFromUnixMs: T0,
    }),
  );
  assert.equal(globalRigStore.getState().chart.tileStatus, "ready");
  assert.equal(globalRigStore.getState().chart.wellProfileHistoryTiles, null);

  store.applyTileSnapshot(
    makeParsedFrame({
      kind: "snapshot",
      subscriptionId: 1_000_000_000,
      stream: "drill",
      tiles: makeDepthTiles([T0], [1000]),
      fromUnixMs: T0,
      toUnixMs: T1,
      replaceFromUnixMs: T0,
    }),
  );
  assert.equal(globalRigStore.getState().chart.wellProfileHistoryTiles, null);

  store.applyTileSnapshot(
    makeParsedFrame({
      kind: "snapshot",
      subscriptionId: 1_000_000_001,
      stream: "drill",
      tiles: makeDepthTiles([T0, T3], [1000, 1100]),
      fromUnixMs: T0,
      toUnixMs: T3,
      replaceFromUnixMs: T0,
    }),
  );
  assert.equal(globalRigStore.getState().chart.wellProfileHistoryStatus, "ready");
  assert.deepEqual(globalRigStore.getState().chart.wellProfileHistoryRange, {
    min: T0,
    max: T3,
  });
  assert.deepEqual(
    globalRigStore
      .getState()
      .chart.wellProfileHistoryTiles?.bins.map((bin) => [
        Date.parse(bin.ts),
        stat(bin.depth).avg,
      ]),
    [
      [T0, 1000],
      [T3, 1100],
    ],
  );
  assert.deepEqual(
    globalRigStore
      .getState()
      .chart.drillTiles?.bins.map((bin) => [Date.parse(bin.ts), stat(bin.rpm).avg]),
    [
      [T0, 0],
      [T1, 1],
    ],
  );

  store.applyTileUpdate(
    makeParsedFrame({
      kind: "update",
      subscriptionId: 1_000_000_001,
      stream: "drill",
      tiles: makeDepthTiles([T2], [1200]),
      fromUnixMs: T0,
      toUnixMs: T3,
      replaceFromUnixMs: T2,
    }),
  );
  assert.deepEqual(
    globalRigStore
      .getState()
      .chart.wellProfileHistoryTiles?.bins.map((bin) => Date.parse(bin.ts)),
    [T0, T3],
  );
});
