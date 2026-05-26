import { useState, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useUi, useChart } from "@/store/app-store";
import { globalRigStore } from "@/store/index-store";

// Live-derived session window. Empty stream → neutral 30 m / 1 h fallback so
// first paint doesn't NaN. Rulers + tracks read from here instead of static
// SESSION_* constants. Snap policy: rulers no longer snap axis outward; the
// formatter `val % labelInterval === 0 ? show : ""` already gates labels.
export function useLiveSessionRange(): {
  depthMin: number;
  depthMax: number;
  timeMin: number;
  timeMax: number;
  cursorDepth: number;
  ropMPerMin: number;
} {
  return useStore(
    globalRigStore,
    useShallow((s) => {
      const drill = s.drillRing;
      if (drill.size === 0) {
        const now = Date.now();
        return {
          depthMin: 0,
          depthMax: 30,
          timeMin: now - 60 * 60 * 1000,
          timeMax: now,
          cursorDepth: 0,
          ropMPerMin: 0.1,
        };
      }
      const drillFirst = drill.first()!;
      const drillLast = drill.latest()!;
      let depthMin = Math.min(drillFirst.depth, drillLast.depth);
      let depthMax = Math.max(drillFirst.depth, drillLast.depth);
      let timeMin = drillFirst.timestamp;
      let timeMax = drillLast.timestamp;

      const geoFirst = s.geoRing.first();
      const geoLast = s.geoRing.latest();
      if (geoFirst && geoLast) {
        const overlapTimeMin = Math.max(timeMin, geoFirst.timestamp);
        const overlapTimeMax = Math.min(timeMax, geoLast.timestamp);
        if (overlapTimeMax > overlapTimeMin) {
          timeMin = overlapTimeMin;
          timeMax = overlapTimeMax;
        }

        const geoDepthMin = Math.min(geoFirst.depth, geoLast.depth);
        const geoDepthMax = Math.max(geoFirst.depth, geoLast.depth);
        const overlapDepthMin = Math.max(depthMin, geoDepthMin);
        const overlapDepthMax = Math.min(depthMax, geoDepthMax);
        if (overlapDepthMax > overlapDepthMin) {
          depthMin = overlapDepthMin;
          depthMax = overlapDepthMax;
        }
      }

      const span = depthMax - depthMin;
      const dTimeMs = timeMax - timeMin;
      const ropMPerMin = dTimeMs > 0 ? (depthMax - depthMin) / dTimeMs * 60_000 : 0.1;
      return {
        depthMin: span < 1 ? depthMax - 30 : depthMin,
        depthMax,
        timeMin,
        timeMax,
        cursorDepth: depthMax,
        ropMPerMin,
      };
    }),
  );
}

export function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return time;
}

export function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  number,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return [ref, width];
}

export function useKeyboardShortcuts() {
  const { dispatch: uiDispatch } = useUi();
  const { dispatch: chartDispatch } = useChart();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") {
        uiDispatch({ type: "SET_SETTINGS_POPOVER", open: false });
        uiDispatch({ type: "SET_ZOOM_POPOVER", open: false });
        uiDispatch({ type: "CLOSE_ACK_MODAL" });
        return;
      }

      if (!cmd) return;

      switch (e.key) {
        case ".":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_GAUGE_SIDEBAR" });
          break;
        case "/":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_ALARM_SIDEBAR" });
          break;
        case "\\":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_BOTH_SIDEBARS" });
          break;
        case "k":
        case "K": {
          e.preventDefault();
          uiDispatch({ type: "SET_SETTINGS_POPOVER", open: true });
          const trigger = document.querySelector(
            "[data-settings-trigger]",
          ) as HTMLButtonElement | null;
          trigger?.focus();
          break;
        }
        case "l":
        case "L":
          e.preventDefault();
          chartDispatch({ type: "TOGGLE_LIVE" });
          break;
        case "b":
        case "B":
          e.preventDefault();
          uiDispatch({ type: "TOGGLE_LEFT_RAIL" });
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [uiDispatch, chartDispatch]);
}
