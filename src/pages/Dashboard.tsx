"use client";

import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { getWellById } from "@/data/wells";
import { useChart } from "@/store/app-store";
import { useKeyboardShortcuts } from "@/hooks/dashboard-hooks";
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
import { useAuth } from "@/hooks/useAuth";
import { ROLE_STREAMS, ROLE_FEATURES } from "@/config/role";
import { StreamDef } from "@/domain/constants";
import { GaugeCollapsedStrip } from "@/components/dashboard/sidebars/GaugeCollapsedStrip";
import { FloatingGaugeSidebar } from "@/components/dashboard/sidebars/FloatingGaugeSidebar";
import { AlarmCollapsedStrip } from "@/components/dashboard/sidebars/AlarmCollapsedStrip";
import { FloatingAlarmSidebar } from "@/components/dashboard/sidebars/FloatingAlarmSidebar";
import { AckModal } from "@/components/dashboard/modals/AckModal";

const ALARM_SIDEBAR_WIDTH = 300;
const STRIP_WIDTH = 32;

export default function Dashboard() {
  const { wellId } = useParams<{ wellId?: string }>();
  const alarmSidebar = useStore(globalRigStore, (s) => s.ui.alarmSidebar);
  const gaugeSidebar = useStore(globalRigStore, (s) => s.ui.gaugeSidebar);
  const setLeftRail = useStore(globalRigStore, (s) => s.setLeftRail);
  const { state: chart } = useChart();
  const { role } = useAuth();
  useKeyboardShortcuts();

  const allowedStreams = role ? ROLE_STREAMS[role] : null;
  const streamAllowed = (uiStream: "drill" | "geo"): boolean => {
    if (!allowedStreams) return false;
    const code = uiStream === "drill" ? StreamDef.DRILL : StreamDef.GEO;
    return allowedStreams.has(code);
  };

  const collapsedBelowBreakpoint = useRef(false);
  useEffect(() => {
    const onResize = () => {
      const below = window.innerWidth < 1366;
      if (below && !collapsedBelowBreakpoint.current) {
        collapsedBelowBreakpoint.current = true;
        setLeftRail("collapsed");
      } else if (!below) {
        collapsedBelowBreakpoint.current = false;
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setLeftRail]);

  const showAlarmSidebar = role ? ROLE_FEATURES[role].alarmSidebar : false;
  const showAckModal = role ? ROLE_FEATURES[role].ackModal : false;

  const alarmAnchor = showAlarmSidebar
    ? (alarmSidebar === "open" ? ALARM_SIDEBAR_WIDTH : STRIP_WIDTH)
    : 0;
  const chartRightInset = STRIP_WIDTH + (showAlarmSidebar ? STRIP_WIDTH : 0);

  if (wellId && !getWellById(wellId)) {
    return <Navigate to="/wells" replace />;
  }

  return (
    <>
      <div
        className="grid h-full w-full overflow-hidden"
        style={{
          gridTemplateRows:
            "var(--spacing-rt-shell-sub) 1fr var(--spacing-rt-shell-foot)",
        }}
      >
        <DashboardSubheader />
        <main className="flex overflow-hidden relative">
          <LeftToolRail />

          <section
            className="flex-1 flex overflow-hidden bg-(--theme-base) relative"
            style={{ paddingRight: chartRightInset }}
          >
            <WellProfileTrack />
            <TimeRuler isPrimary={chart.mode === "time"} />
            <DepthRuler isPrimary={chart.mode === "depth"} />
            <FlowRuler />

            <div className="flex-1 flex overflow-x-auto overflow-y-hidden no-scrollbar">
              {chart.trackOrder
                .filter((id) => id !== "well-profile")
                .filter((id) => chart.trackVisibility[id] ?? true)
                .filter((id) => {
                  const cfg = TRACK_RENDER_CONFIG[id];
                  return cfg ? streamAllowed(cfg.stream) : false;
                })
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

          {gaugeSidebar === "open" ? (
            <FloatingGaugeSidebar rightPosition={alarmAnchor} />
          ) : (
            <GaugeCollapsedStrip rightPosition={alarmAnchor} />
          )}

          {showAlarmSidebar &&
            (alarmSidebar === "open" ? (
              <FloatingAlarmSidebar />
            ) : (
              <AlarmCollapsedStrip />
            ))}
        </main>

        <Footer />
      </div>

      {showAckModal && <AckModal />}
    </>
  );
}
