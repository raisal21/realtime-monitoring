import { useEffect } from "react";
import { useStore } from "zustand";
import { LIVE_WELL_ID } from "@/data/wells";
import { globalRigStore } from "@/store/index-store";

const HISTORY_EXTENT_STREAMS = ["drill", "geo"] as const;

export function useHistoryExtentSync(wellId: string | null | undefined): void {
  const status = useStore(globalRigStore, (s) => s.status);
  const sendMsg = useStore(globalRigStore, (s) => s.sendMsg);

  useEffect(() => {
    if (status !== "ONLINE" || !sendMsg) return;
    if (wellId === null) return;

    const id = wellId?.trim() || LIVE_WELL_ID;
    globalRigStore.getState().setHistoryExtentLoading();
    sendMsg({
      messageType: "HISTORY_EXTENT_REQUEST",
      payload: {
        wellId: id,
        streams: [...HISTORY_EXTENT_STREAMS],
      },
    });
  }, [sendMsg, status, wellId]);
}
