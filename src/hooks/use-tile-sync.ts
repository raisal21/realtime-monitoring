import { useEffect } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { PRESET_TO_MINUTES } from "@/data/dashboard-static";
import { fetchTiles, TileFetchError } from "@/services/tiles-client";
import { isTilePreset, pickResolution } from "@/lib/tile-resolution";
import { log } from "@/utils/logger";

const MS_PER_MIN = 60_000;

// Owns tile lifecycle. A time-mode preset wider than the live ring triggers a
// one-shot fetch of drill + geo tiles for [now − span, now]; anything else
// clears tile state so the chart falls back to the live ring. Mount once.
export function useTileSync(): void {
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const mode = useStore(globalRigStore, (s) => s.chart.mode);

  useEffect(() => {
    const store = globalRigStore.getState();

    if (mode !== "time" || !isTilePreset(rangePreset)) {
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

    let cancelled = false;
    store.setTileLoading();

    Promise.all([
      fetchTiles({ stream: "drill", from, to, res }),
      fetchTiles({ stream: "geo", from, to, res }),
    ])
      .then(([drill, geo]) => {
        if (cancelled) return;
        globalRigStore
          .getState()
          .setTiles(drill, geo, { min: fromMs, max: toMs });
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
  }, [rangePreset, mode]);
}
