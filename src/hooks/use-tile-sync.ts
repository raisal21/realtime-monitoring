import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import {
  buildCustomTileRangeRequest,
  buildPresetTileSubscribe,
} from "@/lib/tile-sync";
import { isTilePreset } from "@/lib/tile-resolution";

// Owns the live tile subscription lifecycle for presets wider than the raw
// live ring; narrow presets keep using the 101/102 telemetry stream.
export function useTileSync(): void {
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const customTileRange = useStore(globalRigStore, (s) => s.chart.customTileRange);
  const status = useStore(globalRigStore, (s) => s.status);
  const sendMsg = useStore(globalRigStore, (s) => s.sendMsg);
  const nextSubscriptionId = useRef(0);
  const activeSubscriptionId = useRef<number | null>(null);

  const nextId = useCallback(() => {
    nextSubscriptionId.current =
      nextSubscriptionId.current >= 0xffffffff
        ? 1
        : nextSubscriptionId.current + 1;
    return nextSubscriptionId.current;
  }, []);

  useEffect(() => {
    const store = globalRigStore.getState();

    if (customTileRange) {
      if (activeSubscriptionId.current !== null && status === "ONLINE" && sendMsg) {
        sendMsg({
          messageType: "TILE_UNSUBSCRIBE",
          payload: { subscriptionId: activeSubscriptionId.current },
        });
      }
      activeSubscriptionId.current = null;

      const request = buildCustomTileRangeRequest(customTileRange, nextId());
      if (!request) {
        store.setTileError("Manual range is too wide for the tile service");
        return;
      }
      if (status !== "ONLINE" || !sendMsg) return;

      store.setTileSubscription(request.subscription, request.range);
      sendMsg(request.message);
      return;
    }

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

    const request = buildPresetTileSubscribe(rangePreset, nextId(), Date.now());
    if (!request) {
      store.setTileError("Range too wide for the tile service");
      return;
    }

    if (status !== "ONLINE" || !sendMsg) return;

    const subscriptionId = request.subscription.subscriptionId;
    activeSubscriptionId.current = subscriptionId;

    store.setTileSubscription(request.subscription, request.range);
    sendMsg(request.message);

    return () => {
      if (activeSubscriptionId.current === subscriptionId) {
        activeSubscriptionId.current = null;
      }
      globalRigStore.getState().sendMsg?.({
        messageType: "TILE_UNSUBSCRIBE",
        payload: { subscriptionId },
      });
    };
  }, [customTileRange, nextId, rangePreset, sendMsg, status]);
}
