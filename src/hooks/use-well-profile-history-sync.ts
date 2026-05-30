import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import {
  buildWellProfileHistoryRequest,
  WELL_PROFILE_REQUEST_ID_MAX,
  WELL_PROFILE_REQUEST_ID_MIN,
  wellProfileHistoryRangeFromExtent,
} from "@/lib/well-profile-history";

export function useWellProfileHistorySync(
  wellId: string | null | undefined,
): void {
  const status = useStore(globalRigStore, (s) => s.status);
  const sendMsg = useStore(globalRigStore, (s) => s.sendMsg);
  const historyExtentStatus = useStore(
    globalRigStore,
    (s) => s.chart.historyExtentStatus,
  );
  const historyExtent = useStore(globalRigStore, (s) => s.chart.historyExtent);
  const profileStatus = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryStatus,
  );
  const profileRange = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryRange,
  );
  const nextRequestId = useRef(WELL_PROFILE_REQUEST_ID_MIN);
  const lastRequestKey = useRef<string | null>(null);

  const nextId = useCallback(() => {
    const id = nextRequestId.current;
    nextRequestId.current =
      id >= WELL_PROFILE_REQUEST_ID_MAX ? WELL_PROFILE_REQUEST_ID_MIN : id + 1;
    return id;
  }, []);

  useEffect(() => {
    const store = globalRigStore.getState();
    if (wellId === null) {
      lastRequestKey.current = null;
      store.clearWellProfileHistory();
      return;
    }

    if (status !== "ONLINE" || !sendMsg) {
      lastRequestKey.current = null;
      return;
    }

    if (historyExtentStatus === "idle" || historyExtentStatus === "loading") {
      return;
    }

    const range = wellProfileHistoryRangeFromExtent(historyExtent);
    if (historyExtentStatus === "error" || !range) {
      lastRequestKey.current = null;
      store.setWellProfileHistoryError("Profile history extent is unavailable");
      return;
    }

    const key = `${wellId ?? "live"}:${Math.trunc(range.min)}:${Math.trunc(
      range.max,
    )}`;
    const readyForRange =
      profileStatus === "ready" &&
      profileRange?.min === range.min &&
      profileRange.max === range.max;
    if (readyForRange || lastRequestKey.current === key) return;

    const requestId = nextId();
    const request = buildWellProfileHistoryRequest(historyExtent, requestId);
    if (!request) {
      lastRequestKey.current = null;
      store.setWellProfileHistoryError("Profile history range is too wide");
      return;
    }

    lastRequestKey.current = key;
    store.setWellProfileHistoryRequest(requestId, request.range);
    sendMsg(request.message);
  }, [
    historyExtent,
    historyExtentStatus,
    nextId,
    profileRange,
    profileStatus,
    sendMsg,
    status,
    wellId,
  ]);
}
