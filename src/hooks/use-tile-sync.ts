import { useEffect } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { PRESET_TO_MINUTES } from "@/data/dashboard-static";
import {
  fetchTiles,
  sharedTileDepthRange,
  sharedTileDataRange,
  TileFetchError,
} from "@/services/tiles-client";
import { isTilePreset, pickResolution } from "@/lib/tile-resolution";
import { log } from "@/utils/logger";

const MS_PER_MIN = 60_000;

// Owns tile lifecycle. A preset wider than the live ring triggers a one-shot
// fetch of drill + geo tiles for [now - span, now]; anything else clears tile
// state so narrow presets fall back to the live ring. Mount once.
export function useTileSync(): void {
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);

  useEffect(() => {
    const store = globalRigStore.getState();

    if (!isTilePreset(rangePreset)) {
      store.clearTiles();
      return;
    }

    const spanMin = PRESET_TO_MINUTES[rangePreset!];
    const res = pickResolution(spanMin);
    if (!res) {
      store.setTileError("Range too wide for the tile service");
      return;
    }

    const toMs = Date.now();
    const fromMs = toMs - spanMin * MS_PER_MIN;
    const from = new Date(fromMs).toISOString();
    const to = new Date(toMs).toISOString();
    const requestedRange = { min: fromMs, max: toMs };

    let cancelled = false;
    store.setTileLoading(requestedRange);

    Promise.all([
      fetchTiles({ stream: "drill", from, to, res }),
      fetchTiles({ stream: "geo", from, to, res }),
    ])
      .then(([drill, geo]) => {
        if (cancelled) return;
        globalRigStore
          .getState()
          .setTiles(
            drill,
            geo,
            sharedTileDataRange(drill, geo, requestedRange),
            sharedTileDepthRange(drill, geo),
          );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof TileFetchError ? e.message : "Tile fetch failed";
        log.warn(`[TILES] ${message}`);
        globalRigStore.getState().setTileError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [rangePreset]);
}
