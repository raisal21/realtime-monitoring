import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useUi } from "@/store/app-store";
import { GAUGES } from "@/data/dashboard-static";
import { StatusDot } from "@/components/core";
import { cn } from "@/lib/utils";

const STRIP_WIDTH = 32;

export function GaugeCollapsedStrip({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();
  const worstStatus = useMemo(() => {
    if (GAUGES.some((g) => g.status === "critical")) return "critical";
    if (GAUGES.some((g) => g.status === "warning")) return "warning";
    return "ok";
  }, []);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
      className={cn(
        "absolute top-0 bottom-0 z-30",
        "flex flex-col items-center gap-2 py-3",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "hover:bg-(--theme-elevated) transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-inset",
        "cursor-pointer",
      )}
      style={{
        width: STRIP_WIDTH,
        right: rightPosition,
        transition: "right 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      aria-label="Expand gauges sidebar"
      title="Expand gauges (Cmd+.)"
    >
      <StatusDot
        status={
          worstStatus === "critical"
            ? "critical"
            : worstStatus === "warning"
              ? "warning"
              : "ok"
        }
        size="md"
        glow
        pulse={worstStatus === "critical"}
      />
      <span className="text-vertical-rl font-['Barlow_Condensed',sans-serif] text-fs-10 font-bold uppercase text-(--theme-fg-muted)">
        Gauges
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