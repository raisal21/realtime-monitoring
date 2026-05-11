import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useUi } from "@/store/app-store";
import { GAUGES } from "@/data/dashboard-static";
import { StatusDot } from "@/components/ui/core";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_STREAMS } from "@/config/role";
import { StreamDef } from "@/domain/constants";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import { LIVE_WELL_ID } from "@/data/wells";

const STRIP_WIDTH = 32;

export function GaugeCollapsedStrip({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();
  const { role } = useAuth();
  const status = useStore(globalRigStore, (s) => s.status);
  const { well } = useCurrentWell();
  const isLive = well?.id === LIVE_WELL_ID;
  const showLive = isLive && status === "ONLINE";

  const allowedStreams = role ? ROLE_STREAMS[role] : null;

  const filteredGauges = useMemo(() => {
    if (!allowedStreams) return [];
    return GAUGES.filter((g) => {
      const code = g.stream === "drill" ? StreamDef.DRILL : StreamDef.GEO;
      return allowedStreams.has(code);
    });
  }, [allowedStreams]);

  const worstStatus = useMemo(() => {
    if (!showLive) return "ok" as const;
    if (filteredGauges.some((g) => g.status === "critical")) return "critical";
    if (filteredGauges.some((g) => g.status === "warning")) return "warning";
    return "ok" as const;
  }, [filteredGauges, showLive]);

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
      aria-label={showLive ? "Expand gauges sidebar" : "No live feed"}
      title={
        !isLive
          ? "No live feed for this well"
          : status !== "ONLINE"
            ? "Connecting…"
            : "Expand gauges (Cmd+.)"
      }
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
        glow={showLive}
        pulse={showLive && worstStatus === "critical"}
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
