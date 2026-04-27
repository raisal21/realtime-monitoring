import { useEffect } from "react";
import { Monitor } from "lucide-react";
import { useUi, useChart } from "../../stores/dashboard-store.tsx";
import { useKeyboardShortcuts } from "../../hooks/dashboard-hooks";
import { UniversalTopbar } from "./shell/UniversalTopbar";
import { DashboardSubheader } from "./shell/DashboardSubheader";
import { Footer } from "./shell/Footer";
import { LeftToolRail } from "./rail/LeftToolRail";
import { WellProfileTrack } from "./chart/WellProfileTrack";
import { TimeRuler } from "./chart/TimeRuler";
import { DepthRuler } from "./chart/DepthRuler";
import { FlowRuler } from "./chart/FlowRuler";
import { LogTrack } from "./chart/LogTrack";
import { GaugeCollapsedStrip } from "./sidebars/GaugeCollapsedStrip";
import { FloatingGaugeSidebar } from "./sidebars/FloatingGaugeSidebar";
import { AlarmCollapsedStrip } from "./sidebars/AlarmCollapsedStrip";
import { FloatingAlarmSidebar } from "./sidebars/FloatingAlarmSidebar";
import { SettingsPopoverWrapper } from "./popovers/SettingsPopoverWrapper";
import { AckModal } from "./modals/AckModal";

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
      <style>{`
        :root {
          --trace-rpm:    #8ec07c;
          --trace-wob:    #fabd2f;
          --trace-torque: #fe8019;
          --trace-spp:    #83a598;
          --trace-hkld:   #d65d0e;
          --trace-gamma:  #b8bb26;
          --trace-rop:    #458588;
          --trace-gas:    #fb4934;
          --trace-inc:    #d3869b;
          --trace-azi:    #8ec07c;
          --trace-depth:  #d3869b;
        }
      `}</style>

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
      <SettingsPopoverWrapper />
    </>
  );
}