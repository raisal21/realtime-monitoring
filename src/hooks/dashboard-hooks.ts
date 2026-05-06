import { useState, useEffect, useRef } from "react";
import { useUi, useChart } from "@/stores/app-store";

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

      if (!cmd) {
        if (e.key === "[") {
          e.preventDefault();
          chartDispatch({ type: "ZOOM_OUT" });
          return;
        }
        if (e.key === "]") {
          e.preventDefault();
          chartDispatch({ type: "ZOOM_IN" });
          return;
        }
        return;
      }

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