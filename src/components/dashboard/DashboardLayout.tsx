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
import { GaugeCollapsedStrip } from "@/components/dashboard/sidebars/GaugeCollapsedStrip";
import { FloatingGaugeSidebar } from "@/components/dashboard/sidebars/FloatingGaugeSidebar";
import { AlarmCollapsedStrip } from "@/components/dashboard/sidebars/AlarmCollapsedStrip";
import { FloatingAlarmSidebar } from "@/components/dashboard/sidebars/FloatingAlarmSidebar";
import { AckModal } from "@/components/dashboard/modals/AckModal";

const ALARM_SIDEBAR_WIDTH = 300;
const STRIP_WIDTH = 32;

export function DashboardLayout() {
  const { state: ui, dispatch: uiDispatch } = useUi();
  const { state: chart } = useChart();
  useKeyboardShortcuts();

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

  return (
    <>
      <div className="screen-guard">
        <Monitor
          size={34}
          strokeWidth={1.5}
          className="text-(--theme-fg-dim) opacity-40"
        />
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
      </div>

      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{ gridTemplateRows: "44px 36px 1fr 28px" }}
      >
        <UniversalTopbar />
        <DashboardSubheader />

        <main className="flex overflow-hidden relative">
          <LeftToolRail />

          <section
            className="flex-1 flex overflow-hidden bg-(--theme-base) relative"
            style={{ paddingRight: STRIP_WIDTH * 2 }}
          >
            <div className="flex-1 flex overflow-x-auto overflow-y-hidden no-scrollbar">
              <WellProfileTrack />
              <TimeRuler isPrimary={chart.mode === "time"} />
              <DepthRuler isPrimary={chart.mode === "depth"} />
              <FlowRuler />

              <LogTrack
                trackId="drill"
                title="DRILL"
                hz="10 Hz"
                stream="drill"
              />
              <LogTrack
                trackId="hydraulics"
                title="HYDRAULICS"
                hz="10 Hz"
                stream="drill"
              />
              <LogTrack trackId="geo" title="GEO" hz="1 Hz" stream="geo" />
              <LogTrack
                trackId="directional"
                title="DIRECTIONAL"
                hz="1 Hz"
                stream="geo"
              />
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

        <Footer />
      </div>

      <AckModal />
    </>
  );
}