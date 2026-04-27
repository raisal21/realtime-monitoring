import { useMemo } from "react";
import { TriangleAlert, ChevronLeft } from "lucide-react";
import { useUi } from "@/stores/dashboard-store";
import { FEED_ITEMS } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

const STRIP_WIDTH = 32;

export function AlarmCollapsedStrip() {
  const { dispatch } = useUi();
  const unackedCritical = useMemo(
    () =>
      FEED_ITEMS.filter(
        (f) => f.state === "unacked" && f.severity === "critical",
      ).length,
    [],
  );
  const totalUnacked = useMemo(
    () => FEED_ITEMS.filter((f) => f.state === "unacked").length,
    [],
  );

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
      className={cn(
        "absolute top-0 bottom-0 right-0 z-30",
        "flex flex-col items-center gap-1.5 py-3",
        "border-l transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-inset",
        "cursor-pointer",
        unackedCritical > 0
          ? "bg-[color-mix(in_srgb,var(--theme-critical)_8%,var(--theme-base))] border-l-(--theme-critical)/40 hover:bg-[color-mix(in_srgb,var(--theme-critical)_15%,var(--theme-base))]"
          : "bg-(--theme-surface) border-l-(--theme-border) hover:bg-(--theme-elevated)",
      )}
      style={{ width: STRIP_WIDTH }}
      aria-label="Expand alarms sidebar"
      title="Expand alarms (Cmd+/)"
    >
      {unackedCritical > 0 && (
        <>
          <TriangleAlert
            size={14}
            strokeWidth={2.25}
            className="text-(--theme-critical) animate-pulse-critical"
          />
          <span className="font-['Share_Tech_Mono',monospace] text-[10px] font-bold text-(--theme-critical) tabular leading-none">
            {totalUnacked}
          </span>
        </>
      )}

      {unackedCritical === 0 && totalUnacked > 0 && (
        <span className="font-['Share_Tech_Mono',monospace] text-[10px] font-bold text-(--theme-warning) tabular leading-none">
          {totalUnacked}
        </span>
      )}

      <div className="flex-1" />

      <span className="text-vertical-rl font-['Barlow_Condensed',sans-serif] text-[10px] font-bold uppercase text-(--theme-fg-muted)">
        Alarms
      </span>
      <div className="flex-1" />
      <ChevronLeft
        size={12}
        strokeWidth={2}
        className="text-(--theme-fg-dim)"
      />
    </button>
  );
}