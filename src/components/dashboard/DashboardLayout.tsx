import { useEffect } from "react";
import { Monitor } from "lucide-react";
import { useUi, useChart } from "@/stores/dashboard-store";
import { useKeyboardShortcuts } from "@/hooks/dashboard-hooks";
import { UniversalTopbar } from "@/components/dashboard/shell/UniversalTopbar";
import { DashboardSubheader } from "@/components/dashboard/shell/DashboardSubheader";
import { Footer } from "@/components/dashboard/shell/Footer";
import { LeftToolRail } from "@/components/dashboard/rail/LeftToolRail";
import { WellProfileTrack } from "@/components/dashboard/chart/WellProfileTrack";
import { TimeRuler } from "@/components/dashboard/chart/TimeRuler";
import { DepthRuler } from "@/components/dashboard/chart/DepthRuler";
import { FlowRuler } from "@/components/dashboard/chart/FlowRuler";
import { LogTrack } from "@/components/dashboard/chart/LogTrack";
import { TRACK_RENDER_CONFIG } from "@/data/dashboard-static";
import type { TRACK_TRACES } from "@/data/dashboard-static";
import { GaugeCollapsedStrip } from "@/components/dashboard/sidebars/GaugeCollapsedStrip";
import { FloatingGaugeSidebar } from "@/components/dashboard/sidebars/FloatingGaugeSidebar";
import { AlarmCollapsedStrip } from "@/components/dashboard/sidebars/AlarmCollapsedStrip";
import { FloatingAlarmSidebar } from "@/components/dashboard/sidebars/FloatingAlarmSidebar";
import { AckModal } from "@/components/dashboard/modals/AckModal";

const ALARM_SIDEBAR_WIDTH = 300;
const STRIP_WIDTH = 32;

export function DashboardLayout({ wellId }: { wellId?: string }) {
  const { state: ui, dispatch: uiDispatch } = useUi();
  const { state: chart } = useChart();
  useKeyboardShortcuts();

  // Placeholder for dropped frames counter (WebSocket integration pending)
  const droppedFrames = 0;

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1366 && ui.leftRail === "expanded") {
        uiDispatch({ type: "SET_LEFT_RAIL", value: "collapsed" });
      }
    };
    checkWidth();
  }, []);

  const alarmAnchor =
    ui.alarmSidebar === "open" ? ALARM_SIDEBAR_WIDTH : STRIP_WIDTH;
  // Chart section reserves only the collapsed strip widths on the right
  // (gauge strip + alarm strip). Open sidebars float on top of the chart
  // instead of shrinking it, keeping canvas width constant.
  const chartRightInset = STRIP_WIDTH * 2;

  return (
    <>
      <div className="screen-guard">
        <Monitor
          size={34}
          strokeWidth={1.5}
          className="text-(--theme-fg-dim) opacity-40"
        />
        <span className="section-heading text-fs-16">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-fs-12 text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
      </div>

      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{
          gridTemplateRows:
            "var(--spacing-rt-shell-top) var(--spacing-rt-shell-sub) 1fr var(--spacing-rt-shell-foot)",
        }}
      >
        <UniversalTopbar wellId={wellId} />

        <DashboardSubheader wellId={wellId} />
        <main className="flex overflow-hidden relative">
          <LeftToolRail />

          <section
            className="flex-1 flex overflow-hidden bg-(--theme-base) relative"
            style={{ paddingRight: chartRightInset }}
          >
            {/* Permanent left columns — sticky, never scroll horizontally */}
            <WellProfileTrack />
            <TimeRuler isPrimary={chart.mode === "time"} />
            <DepthRuler isPrimary={chart.mode === "depth"} />
            <FlowRuler />

            {/* LogTracks scroll horizontally when their total width exceeds
                the available chart area (e.g. when sidebars float over). */}
            <div className="flex-1 flex overflow-x-auto overflow-y-hidden no-scrollbar">
              {chart.trackOrder
                .filter((id) => id !== "well-profile")
                .filter((id) => chart.trackVisibility[id] ?? true)
                .map((id) => {
                  const cfg = TRACK_RENDER_CONFIG[id];
                  if (!cfg) return null;
                  return (
                    <LogTrack
                      key={id}
                      trackId={id as keyof typeof TRACK_TRACES}
                      title={cfg.title}
                      hz={cfg.hz}
                      stream={cfg.stream}
                    />
                  );
                })}
              <div className="flex-1 bg-(--theme-base)" />
            </div>
          </section>

          {ui.gaugeSidebar === "open" ? (
            <FloatingGaugeSidebar rightPosition={alarmAnchor} />
          ) : (
            <GaugeCollapsedStrip rightPosition={alarmAnchor} />
          )}

          {ui.alarmSidebar === "open" ? (
            <FloatingAlarmSidebar />
          ) : (
            <AlarmCollapsedStrip />
          )}
        </main>

        <Footer droppedFrames={droppedFrames} />
      </div>

      <AckModal />
    </>
  );
}