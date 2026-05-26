import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatLocalHHMM } from "../src/lib/time-format";

function localHHMM(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

describe("formatLocalHHMM", () => {
  it("formats epoch milliseconds as local wall-clock time", () => {
    const epochMs = Date.UTC(2026, 4, 26, 10, 5, 30);

    assert.equal(formatLocalHHMM(epochMs), localHHMM(epochMs));
  });

  it("does not treat epoch milliseconds as minutes of day", () => {
    const epochMs = Date.UTC(2026, 4, 26, 10, 5, 30);
    const minutesOfDay = ((epochMs % 1440) + 1440) % 1440;
    const oldLabel = `${Math.floor(minutesOfDay / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(minutesOfDay % 60)
      .toString()
      .padStart(2, "0")}`;

    assert.notEqual(formatLocalHHMM(epochMs), oldLabel);
  });

  it("returns a stable placeholder for invalid values", () => {
    assert.equal(formatLocalHHMM(Number.NaN), "--:--");
  });
});
