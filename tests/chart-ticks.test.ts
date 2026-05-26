import assert from "node:assert/strict";
import test from "node:test";
import {
  getEnvelopeBinCount,
  getTickCount,
  MAX_ENVELOPE_BINS,
  MAX_TICKS,
  MIN_ENVELOPE_BINS,
  MIN_TICKS,
} from "../src/lib/chart-ticks.ts";

test("visible tick count targets 8 to 12 on normal dashboard heights", () => {
  assert.equal(getTickCount(480), 8);
  assert.equal(getTickCount(600), 10);
  assert.equal(getTickCount(720), 12);
});

test("visible tick count clamps at the chosen minimum and maximum", () => {
  assert.equal(getTickCount(0), MIN_TICKS);
  assert.equal(getTickCount(320), MIN_TICKS);
  assert.equal(getTickCount(1000), MAX_TICKS);
});

test("envelope bin count remains independent from visible tick count", () => {
  assert.equal(getEnvelopeBinCount(0), MIN_ENVELOPE_BINS);
  assert.equal(getEnvelopeBinCount(600), MIN_ENVELOPE_BINS);
  assert.equal(getEnvelopeBinCount(4000), MAX_ENVELOPE_BINS);
});
