import { Clock, Bell } from "lucide-react";
import { useClock, useResizeObserver } from "@/hooks/dashboard-hooks";
import { CURRENT_WELL, WELL_SESSION, FEED_ITEMS } from "@/data/dashboard-static";
import { getWellById } from "@/data/wells";
import { useSettings, useUi } from "@/stores/dashboard-store";
import { ValueReadout } from "@/components/telemetry";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const padNames: Record<string, string> = {
  "pad-a": "Guntur",
  "pad-b": "Talpad",
  "pad-c": "North Ridge",
};

export function DashboardSubheader({ wellId }: { wellId?: string }) {
  const time = useClock();
  const { state: settings } = useSettings();
  const { dispatch } = useUi();
  const [ref, width] = useResizeObserver<HTMLDivElement>();

  // Resolve the active well
  const well = wellId ? getWellById(wellId) : undefined;
  const displayWell = well ?? CURRENT_WELL;

  // Build the label parts
  const wellLabel = well ? well.name : displayWell.name;
  const blockLabel = well
    ? (padNames[well.padId] ?? well.padId)
    : displayWell.block;
  const regionLabel = well?.region ?? displayWell.region;

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

  // In compact mode we always drop the secondary region label, even if there's room.
  const showFullLabel = width >= 640 && settings.density !== "compact";

  return (
    <div
      className={cn(
        "flex items-center px-4 gap-4 flex-shrink-0 z-40 h-rt-shell-sub",
        "bg-(--theme-base) border-b border-(--theme-border)",
      )}
    >
      <div ref={ref} className="flex-1 min-w-0">
        <span
          className={cn(
            "font-['Barlow_Condensed',sans-serif] text-fs-15 font-semibold tracking-[0.04em]",
            "text-(--theme-fg) block truncate",
          )}
        >
          {showFullLabel ? (
            <>
              {wellLabel}
              <span className="text-(--theme-fg-muted) font-normal mx-2">·</span>
              {blockLabel}
              <span className="text-(--theme-fg-dim) font-normal mx-2">·</span>
              <span className="text-(--theme-fg-muted) font-normal">
                {regionLabel}
              </span>
            </>
          ) : (
            <>
              {wellLabel}
              <span className="text-(--theme-fg-muted) font-normal mx-2">·</span>
              {blockLabel}
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock size={13} strokeWidth={2} className="text-(--theme-fg-dim)" />
        <ValueReadout value={time} size="sm" />
        <span className="label-mono">UTC</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 pl-4 border-l border-(--theme-border)">
        <span className="label-mono">Live Depth</span>
        <ValueReadout value={WELL_SESSION.cursor.depthLabel} unit="ft MD" size="md" status="info" />
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 pl-3 border-l border-(--theme-border)">
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
          className={cn(
            "relative flex items-center justify-center",
            "w-[24px] h-[24px] rounded-(--radius-badge)",
            "border border-transparent cursor-pointer",
            "text-(--theme-fg-muted)",
            "transition-all duration-150",
            "hover:bg-(--theme-elevated) hover:border-(--theme-border) hover:text-(--theme-fg)",
            unackedCritical > 0 && [
              "text-(--theme-critical)",
              "border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
              "bg-[color-mix(in_srgb,var(--theme-critical)_10%,transparent)]",
              "animate-[topbar-alarm-pulse_2s_ease-in-out_infinite]",
            ],
          )}
          title={`${totalUnacked} unacked alarms`}
          aria-label="Alarms"
        >
          <Bell size={13} strokeWidth={2} />
          {totalUnacked > 0 && (
            <span
              aria-label={`${totalUnacked} unacknowledged`}
              className={cn(
                "absolute -top-1 -right-1",
                "min-w-[12px] h-[12px] px-0.5",
                "rounded-full flex items-center justify-center",
                "bg-(--theme-critical) text-white",
                "font-['Share_Tech_Mono',monospace] text-fs-7 font-bold leading-none",
              )}
            >
              {totalUnacked > 9 ? "9+" : totalUnacked}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}