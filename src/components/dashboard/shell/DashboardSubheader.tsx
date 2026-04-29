import { Clock } from "lucide-react";
import { useClock, useResizeObserver } from "@/hooks/dashboard-hooks";
import { CURRENT_WELL } from "@/data/dashboard-static";
import { useSettings } from "@/stores/dashboard-store";
import { ValueReadout } from "@/components/telemetry";
import { cn } from "@/lib/utils";

export function DashboardSubheader() {
  const time = useClock();
  const { state: settings } = useSettings();
  const [ref, width] = useResizeObserver<HTMLDivElement>();
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
              {CURRENT_WELL.name}
              <span className="text-(--theme-fg-muted) font-normal mx-2">·</span>
              {CURRENT_WELL.block}
              <span className="text-(--theme-fg-dim) font-normal mx-2">·</span>
              <span className="text-(--theme-fg-muted) font-normal">
                {CURRENT_WELL.region}
              </span>
            </>
          ) : (
            <>
              {CURRENT_WELL.name}
              <span className="text-(--theme-fg-muted) font-normal mx-2">·</span>
              {CURRENT_WELL.block}
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
        <ValueReadout value="12,563" unit="ft MD" size="md" status="info" />
      </div>
    </div>
  );
}