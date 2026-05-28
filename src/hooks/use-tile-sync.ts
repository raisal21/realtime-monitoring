import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { PRESET_TO_MINUTES } from "@/data/dashboard-static";
import { isTilePreset, pickResolution } from "@/lib/tile-resolution";

const MS_PER_MIN = 60_000;
const TILE_STREAMS: ("drill" | "geo")[] = ["drill", "geo"];

// Owns the live tile subscription lifecycle for presets wider than the raw
// live ring; narrow presets keep using the 101/102 telemetry stream.
export function useTileSync(): void {
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const status = useStore(globalRigStore, (s) => s.status);
  const sendMsg = useStore(globalRigStore, (s) => s.sendMsg);
  const nextSubscriptionId = useRef(0);
  const activeSubscriptionId = useRef<number | null>(null);

  useEffect(() => {
    const store = globalRigStore.getState();

    if (!isTilePreset(rangePreset)) {
      if (activeSubscriptionId.current !== null && status === "ONLINE" && sendMsg) {
        sendMsg({
          messageType: "TILE_UNSUBSCRIBE",
          payload: { subscriptionId: activeSubscriptionId.current },
        });
      }
      activeSubscriptionId.current = null;
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
    const requestedRange = { min: fromMs, max: toMs };

    if (status !== "ONLINE" || !sendMsg) return;

    nextSubscriptionId.current =
      nextSubscriptionId.current >= 0xffffffff
        ? 1
        : nextSubscriptionId.current + 1;
    const subscriptionId = nextSubscriptionId.current;
    activeSubscriptionId.current = subscriptionId;

    store.setTileSubscription(
      {
        subscriptionId,
        spanMinutes: spanMin,
        res,
        streams: TILE_STREAMS,
      },
      requestedRange,
    );

    sendMsg({
      messageType: "TILE_SUBSCRIBE",
      payload: {
        subscriptionId,
        spanMinutes: spanMin,
        res,
        streams: TILE_STREAMS,
      },
    });

    return () => {
      if (activeSubscriptionId.current === subscriptionId) {
        activeSubscriptionId.current = null;
      }
      globalRigStore.getState().sendMsg?.({
        messageType: "TILE_UNSUBSCRIBE",
        payload: { subscriptionId },
      });
    };
  }, [rangePreset, sendMsg, status]);
}
