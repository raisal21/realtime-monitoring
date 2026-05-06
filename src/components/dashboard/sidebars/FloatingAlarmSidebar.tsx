import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useUi } from "@/stores/app-store";
import { FEED_ITEMS } from "@/data/dashboard-static";
import { IconButton } from "@/components/form";
import { CriticalBanner } from "@/components/alarm";
import { FilterChip, FeedItem } from "@/components/alarm";
import { cn } from "@/lib/utils";

const ALARM_SIDEBAR_WIDTH = 300;

export function FloatingAlarmSidebar() {
  const { state: ui, dispatch } = useUi();

  const visibleItems = useMemo(() => {
    return FEED_ITEMS.filter((f) => {
      if (f.severity === "critical") return ui.alarmFilters.critical;
      if (f.severity === "warning") return ui.alarmFilters.warning;
      if (f.severity === "info") return ui.alarmFilters.info;
      return true;
    });
  }, [ui.alarmFilters]);

  const criticalUnacked = FEED_ITEMS.find(
    (f) => f.severity === "critical" && f.state === "unacked",
  );

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 right-0 z-30",
        "bg-(--theme-base) border-l border-(--theme-border)",
        "flex flex-col overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.4)]",
        "animate-sidebar-slide-in-right",
      )}
      style={{ width: ALARM_SIDEBAR_WIDTH }}
    >
      {criticalUnacked && (
        <CriticalBanner
          title={criticalUnacked.message}
          subtitle={`${criticalUnacked.meta} · ${criticalUnacked.timestamp}`}
        />
      )}

      <div className="flex items-center gap-1.5 px-rt-pad-sm py-rt-pad-sm border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">Alarms & Notes</span>
        <FilterChip
          intent="critical"
          active={ui.alarmFilters.critical}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "critical" })
          }
        >
          CRIT
        </FilterChip>
        <FilterChip
          intent="warning"
          active={ui.alarmFilters.warning}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "warning" })
          }
        >
          WARN
        </FilterChip>
        <FilterChip
          intent="info"
          active={ui.alarmFilters.info}
          onClick={() =>
            dispatch({ type: "TOGGLE_ALARM_FILTER", filter: "info" })
          }
        >
          INFO
        </FilterChip>
        <IconButton
          intent="ghost"
          size="sm"
          onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
          aria-label="Collapse alarms sidebar"
          title="Collapse (Cmd+/)"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => (
          <FeedItem
            key={item.id}
            severity={item.severity}
            state={item.state}
            message={item.message}
            meta={item.meta}
            timestamp={item.timestamp}
            onAck={() => dispatch({ type: "OPEN_ACK_MODAL", alarmId: item.id })}
            onDetails={() => {}}
          />
        ))}
        {visibleItems.length === 0 && (
          <div className="px-4 py-6 text-center">
            <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-dim)">
              No alarms match current filters
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}