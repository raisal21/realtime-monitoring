import { Search, Clock, Ruler, ChevronsLeft, ChevronsRight, LayoutGrid, Gauge as GaugeIcon, TriangleAlert } from "lucide-react";
import { useChart, useUi, type ChartMode } from "../../../stores/dashboard-store.tsx";
import {
  Popover,
  PopoverTrigger,
  RailSection,
  RadioCard,
  RadioCardGroup,
  LiveBadge,
  cn,
} from "../../../components";
import { ZoomPopoverContent } from "../popovers/ZoomPopover";
import { DisplayLayoutPopoverContent } from "../popovers/DisplayLayoutPopover";

const RAIL_WIDTH_EXPANDED = 150;
const RAIL_WIDTH_COLLAPSED = 48;

export function LeftToolRail() {
  const { state: chart, dispatch } = useChart();
  const { state: ui, dispatch: uiDispatch } = useUi();
  const isCollapsed = ui.leftRail === "collapsed";

  return (
    <aside
      className={cn(
        "flex flex-col gap-3 py-3 flex-shrink-0 relative",
        "bg-(--theme-surface) border-r border-(--theme-border)",
        "z-10 overflow-hidden",
        isCollapsed ? "px-1.5" : "px-3",
      )}
      style={{
        width: isCollapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED,
        transition: "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <RailSection label="Mode" collapsed={isCollapsed}>
        <RadioCardGroup
          value={chart.mode}
          onValueChange={(v) =>
            v && dispatch({ type: "SET_MODE", mode: v as ChartMode })
          }
          className="flex flex-col gap-1.5"
        >
          <RadioCard
            value="time"
            size="sm"
            compact={isCollapsed}
            icon={<Clock size={14} strokeWidth={2} />}
            title="Time"
            subtitle="UTC ref"
          />
          <RadioCard
            value="depth"
            size="sm"
            compact={isCollapsed}
            icon={<Ruler size={14} strokeWidth={2} />}
            title="Depth"
            subtitle="ft MD ref"
          />
        </RadioCardGroup>
      </RailSection>

      <RailSection label="Zoom" collapsed={isCollapsed}>
        <Popover
          open={ui.zoomPopover}
          onOpenChange={(open) =>
            uiDispatch({ type: "SET_ZOOM_POPOVER", open })
          }
        >
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex items-center cursor-pointer transition-all duration-150 outline-none",
                  "bg-(--theme-elevated) border border-(--theme-border)",
                  "rounded-(--radius-badge)",
                  "hover:border-(--theme-fg-dim) hover:bg-(--theme-overlay)",
                  "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
                  "data-[popup-open]:border-(--theme-accent) data-[popup-open]:bg-(--theme-accent-dim)",
                  isCollapsed ? "size-9 justify-center" : "gap-2 px-2.5 py-2",
                )}
                aria-label="Open zoom controls"
                title={isCollapsed ? "Zoom" : undefined}
              >
                <Search
                  size={14}
                  strokeWidth={2}
                  className="text-(--theme-fg-muted) shrink-0"
                />
                {!isCollapsed && (
                  <>
                    <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-(--theme-fg)">
                      Zoom
                    </span>
                    <span className="flex-1" />
                    <LiveBadge
                      state={chart.liveMode ? "live" : "frozen"}
                      className="text-[8px] px-1 py-0"
                    />
                  </>
                )}
              </button>
            }
          />
          <ZoomPopoverContent />
        </Popover>
      </RailSection>

      <RailSection label="Layout" collapsed={isCollapsed}>
        <Popover
          open={ui.displayLayoutPopover}
          onOpenChange={(open) =>
            uiDispatch({ type: "SET_DISPLAY_LAYOUT_POPOVER", open })
          }
        >
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex items-center cursor-pointer transition-all duration-150 outline-none",
                  "bg-(--theme-elevated) border border-(--theme-border)",
                  "rounded-(--radius-badge)",
                  "hover:border-(--theme-fg-dim) hover:bg-(--theme-overlay)",
                  "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
                  "data-[popup-open]:border-(--theme-accent) data-[popup-open]:bg-(--theme-accent-dim)",
                  isCollapsed ? "size-9 justify-center" : "gap-2 px-2.5 py-2",
                )}
                aria-label="Display layout"
                title={isCollapsed ? "Layout" : undefined}
              >
                <LayoutGrid
                  size={14}
                  strokeWidth={2}
                  className="text-(--theme-fg-muted) shrink-0"
                />
                {!isCollapsed && (
                  <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-(--theme-fg)">
                    Tracks
                  </span>
                )}
              </button>
            }
          />
          <DisplayLayoutPopoverContent />
        </Popover>
      </RailSection>

      <div className="flex-1" />

      <RailSection label="Panels" collapsed={isCollapsed}>
        <button
          type="button"
          onClick={() => uiDispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
          className={cn(
            "flex items-center cursor-pointer transition-all duration-150",
            "rounded-(--radius-badge) border",
            isCollapsed ? "size-9 justify-center" : "gap-2 px-2.5 py-1.5",
            ui.gaugeSidebar === "open"
              ? "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)"
              : "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted) hover:text-(--theme-fg)",
          )}
          aria-label="Toggle gauges sidebar"
          title={isCollapsed ? "Gauges (Cmd+.)" : undefined}
        >
          <GaugeIcon size={12} strokeWidth={2} />
          {!isCollapsed && (
            <span className="font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em]">
              Gauges
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => uiDispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
          className={cn(
            "flex items-center cursor-pointer transition-all duration-150",
            "rounded-(--radius-badge) border",
            isCollapsed ? "size-9 justify-center" : "gap-2 px-2.5 py-1.5",
            ui.alarmSidebar === "open"
              ? "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)"
              : "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted) hover:text-(--theme-fg)",
          )}
          aria-label="Toggle alarms sidebar"
          title={isCollapsed ? "Alarms (Cmd+/)" : undefined}
        >
          <TriangleAlert size={12} strokeWidth={2} />
          {!isCollapsed && (
            <span className="font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold uppercase tracking-[0.06em]">
              Alarms
            </span>
          )}
        </button>
      </RailSection>

      <button
        type="button"
        onClick={() => uiDispatch({ type: "TOGGLE_LEFT_RAIL" })}
        className={cn(
          "flex items-center justify-center cursor-pointer transition-all duration-150",
          "rounded-(--radius-badge) border border-(--theme-border-subtle)",
          "bg-(--theme-elevated) hover:bg-(--theme-overlay)",
          "text-(--theme-fg-dim) hover:text-(--theme-fg)",
          "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
          isCollapsed ? "size-9" : "h-7",
        )}
        aria-label={isCollapsed ? "Expand left rail" : "Collapse left rail"}
        title={`${isCollapsed ? "Expand" : "Collapse"} (Cmd+B)`}
      >
        {isCollapsed ? (
          <ChevronsRight size={14} strokeWidth={2} />
        ) : (
          <ChevronsLeft size={14} strokeWidth={2} />
        )}
      </button>
    </aside>
  );
}