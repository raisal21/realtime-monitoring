import assert from "node:assert/strict";
import test from "node:test";
import { binMinMax, type Envelope } from "../src/lib/bin-mm.ts";

interface Sample {
  y: number;
  value: number;
}

function makeRing(samples: readonly Sample[]) {
  return {
    size: samples.length,
    field(name: string, i: number): number {
      const sample = samples[i];
      if (!sample) throw new RangeError(`No sample at ${i}`);
      return name === "y" ? sample.y : sample.value;
    },
  };
}

function allY(env: Envelope): number[] {
  return [...env.min, ...env.max, ...env.line].map(([, y]) => y);
}

test("returns empty envelopes for an empty ring", () => {
  const env = binMinMax(makeRing([]), "value", "y", {
    binCount: 60,
    yMin: 0,
    yMax: 10,
    anchorEdges: true,
  });

  assert.deepEqual(env, { min: [], max: [], line: [] });
});

test("anchors a single visible sample without duplicating it", () => {
  const env = binMinMax(makeRing([{ y: 5, value: 42 }]), "value", "y", {
    binCount: 60,
    yMin: 0,
    yMax: 10,
    anchorEdges: true,
  });

  assert.deepEqual(env.min, [[42, 5]]);
  assert.deepEqual(env.max, [[42, 5]]);
  assert.deepEqual(env.line, [[42, 5]]);
});

test("preserves the numeric binCount call shape", () => {
  const env = binMinMax(
    makeRing([
      { y: 0, value: 3 },
      { y: 10, value: 1 },
      { y: 20, value: 5 },
      { y: 30, value: 2 },
    ]),
    "value",
    "y",
    2,
  );

  assert.deepEqual(env.min, [
    [1, 10],
    [2, 30],
  ]);
  assert.deepEqual(env.max, [
    [3, 0],
    [5, 20],
  ]);
  assert.deepEqual(env.line, [
    [3, 0],
    [1, 10],
    [5, 20],
    [2, 30],
  ]);
});

test("anchors first and last visible samples at viewport edges", () => {
  const env = binMinMax(
    makeRing([
      { y: 0, value: 50 },
      { y: 10, value: 40 },
      { y: 20, value: 10 },
      { y: 30, value: 90 },
      { y: 40, value: 55 },
    ]),
    "value",
    "y",
    { binCount: 2, yMin: 0, yMax: 40, anchorEdges: true },
  );

  assert.deepEqual(env.min[0], [50, 0]);
  assert.deepEqual(env.max[0], [50, 0]);
  assert.deepEqual(env.min.at(-1), [55, 40]);
  assert.deepEqual(env.max.at(-1), [55, 40]);
  assert.deepEqual(env.line[0], [50, 0]);
  assert.deepEqual(env.line.at(-1), [55, 40]);
});

test("filters bins to the requested viewport", () => {
  const env = binMinMax(
    makeRing([
      { y: 0, value: 100 },
      { y: 10, value: 4 },
      { y: 20, value: 8 },
      { y: 30, value: 2 },
      { y: 40, value: 200 },
    ]),
    "value",
    "y",
    { binCount: 60, yMin: 10, yMax: 30, anchorEdges: true },
  );

  assert.ok(allY(env).every((y) => y >= 10 && y <= 30));
  assert.deepEqual(env.min[0], [4, 10]);
  assert.deepEqual(env.max.at(-1), [2, 30]);
  assert.deepEqual(env.line[0], [4, 10]);
  assert.deepEqual(env.line.at(-1), [2, 30]);
});

test("keeps one-sample outliers inside the min/max envelope", () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({
    y: i,
    value: i === 55 ? 999 : 1,
  }));

  const env = binMinMax(makeRing(samples), "value", "y", {
    binCount: 10,
    yMin: 0,
    yMax: 99,
    anchorEdges: true,
  });

  assert.ok(env.max.some(([value, y]) => value === 999 && y === 55));
  assert.ok(env.line.some(([value, y]) => value === 999 && y === 55));
});
