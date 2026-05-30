import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { HistoryExtentMessage } from "../src/domain/message.types.ts";
import {
  capRangeToLatest,
  CUSTOM_HISTORY_MAX_MS,
  clampRangeToHistoryExtent,
  historyExtentDateBounds,
  historyExtentTimeRange,
} from "../src/lib/history-extent.ts";

function extent(minTimeMs: number | null, maxTimeMs: number | null): HistoryExtentMessage {
  return {
    wellId: "ga-01",
    streams: {
      drill: {
        minTimeMs,
        maxTimeMs,
        minDepth: null,
        maxDepth: null,
      },
      geo: {
        minTimeMs,
        maxTimeMs,
        minDepth: null,
        maxDepth: null,
      },
    },
    shared: {
      minTimeMs,
      maxTimeMs,
      minDepth: null,
      maxDepth: null,
      timeMode: "intersection",
      depthSource: "drill",
    },
    warnings: [],
  };
}

describe("historyExtentTimeRange", () => {
  it("uses the backend shared QuestDB time extent", () => {
    assert.deepEqual(historyExtentTimeRange(extent(1_000, 2_000)), {
      min: 1_000,
      max: 2_000,
    });
  });

  it("returns null for incomplete or invalid shared extents", () => {
    assert.equal(historyExtentTimeRange(extent(null, 2_000)), null);
    assert.equal(historyExtentTimeRange(extent(3_000, 2_000)), null);
  });
});

describe("historyExtentDateBounds", () => {
  it("converts epoch-ms extents to local calendar days", () => {
    const from = new Date(2026, 2, 4, 10, 30).getTime();
    const to = new Date(2026, 2, 6, 22, 15).getTime();
    const bounds = historyExtentDateBounds({ min: from, max: to });

    assert.deepEqual(
      [
        bounds.from.getFullYear(),
        bounds.from.getMonth(),
        bounds.from.getDate(),
        bounds.from.getHours(),
      ],
      [2026, 2, 4, 0],
    );
    assert.deepEqual(
      [
        bounds.to.getFullYear(),
        bounds.to.getMonth(),
        bounds.to.getDate(),
        bounds.to.getHours(),
      ],
      [2026, 2, 6, 0],
    );
  });
});

describe("capRangeToLatest", () => {
  it("keeps only the latest 30 days for manual exploration", () => {
    const max = Date.parse("2026-05-29T00:00:00.000Z");

    assert.deepEqual(capRangeToLatest({ min: max - 40 * 24 * 60 * 60_000, max }), {
      min: max - CUSTOM_HISTORY_MAX_MS,
      max,
    });
  });

  it("preserves shorter history extents", () => {
    assert.deepEqual(capRangeToLatest({ min: 1_000, max: 2_000 }), {
      min: 1_000,
      max: 2_000,
    });
  });
});

describe("clampRangeToHistoryExtent", () => {
  it("clips partially overlapping picked time ranges", () => {
    assert.deepEqual(
      clampRangeToHistoryExtent(500, 1_500, { min: 1_000, max: 2_000 }),
      { min: 1_000, max: 1_500 },
    );
  });

  it("returns null when the picked range does not overlap history", () => {
    assert.equal(
      clampRangeToHistoryExtent(100, 500, { min: 1_000, max: 2_000 }),
      null,
    );
  });
});
