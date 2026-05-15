import { useCallback, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE } from "@/store/app-store";
import { useLiveSessionRange } from "@/hooks/dashboard-hooks";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import { LIVE_WELL_ID } from "@/data/wells";
import { getChartColors } from "@/lib/echarts-theme";
import { formatDepth } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  getViewport,
  type ViewportSession,
} from "@/lib/chart-viewport";
import type { DrillUpdate } from "@/domain/message.types";

// Flow baseline (gpm). Live stub holds rigState.flow around 1500; we render
// the signed delta (flow - FLOW_BASELINE) so positive = "in", negative = "out".
const FLOW_BASELINE = 1500;
const FLOW_SCALE = 200;

const minutesToHHMM = (min: number) => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.floor(wrapped % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export function FlowRuler() {
  // Per-field selectors: avoid re-render on unrelated chart mutations
  // (crosshair, traceVisibility, track layout).
  const mode = useStore(globalRigStore, (s) => s.chart.mode);
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const rulerRange = useStore(globalRigStore, (s) => s.chart.rulerRange);
  const logTrackRange = useStore(globalRigStore, (s) => s.chart.logTrackRange);
  const status = useStore(globalRigStore, (s) => s.status);
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];
  const {
    depthMin,
    depthMax,
    timeMin,
    timeMax,
    cursorDepth,
    ropMPerMin,
  } = useLiveSessionRange();
  const { well } = useCurrentWell();
  const isLive = well?.id === LIVE_WELL_ID;
  const showLive = isLive && status === "ONLINE";

  const chartRef = useRef<ReactECharts>(null);
  const pendingRaf = useRef<number | null>(null);

  // Shared viewport helper — same window as primary ruler / LogTrack.
  const session: ViewportSession =
    mode === "depth"
      ? { min: depthMin, max: depthMax, cursor: cursorDepth, ropMPerMin }
      : { min: timeMin, max: timeMax, cursor: timeMax };
  const yRange = getViewport(
    { rangePreset, rulerRange, logTrackRange },
    session,
    true,
    mode,
  );

  const buildOption = useCallback((): EChartsOption => {
    const c = getChartColors();

    const stream = globalRigStore.getState().drillStream;
    const yKey: keyof DrillUpdate = mode === "depth" ? "depth" : "timestamp";
    const inRange = stream.filter((s) => {
      const v = s[yKey];
      return v >= yRange.min && v <= yRange.max;
    });

    return {
      animation: false,
      backgroundColor: c.base,
      grid: {
        top: 4,
        bottom: 4,
        left: 4,
        right: 4,
        containLabel: false,
      },
      xAxis: {
        type: "value",
        min: -FLOW_SCALE,
        max: FLOW_SCALE,
        show: false,
        splitLine: {
          show: true,
          lineStyle: { color: c.border, width: 0.5 },
        },
      },
      // Value axis matching the active ruler — guarantees vertical alignment
      // with TimeRuler / DepthRuler regardless of zoom state.
      yAxis: {
        type: "value",
        min: yRange.min,
        max: yRange.max,
        inverse: true,
        show: false,
      },
      series: [
        {
          type: "custom",
          renderItem: (_params, api) => {
            const flow = api.value(0) as number;
            const yVal = api.value(1) as number;
            const origin = api.coord([0, yVal]) as [number, number];
            const tip = api.coord([flow, yVal]) as [number, number];
            const x = Math.min(origin[0], tip[0]);
            const w = Math.abs(tip[0] - origin[0]);
            return {
              type: "rect",
              shape: { x, y: origin[1] - 1, width: w, height: 2 },
              style: {
                fill: flow >= 0 ? c.info : c.critical,
                opacity: 0.85,
              },
            };
          },
          encode: { x: 0, y: 1 },
          data: inRange.map((s) => [s.flow - FLOW_BASELINE, s[yKey]]),
          tooltip: { show: true },
        },
      ],
      tooltip: {
        trigger: "item",
        backgroundColor: c.elevated,
        borderColor: c.border,
        borderWidth: 1,
        padding: [5, 8],
        textStyle: {
          color: c.fg,
          fontSize: 9 * fsScale,
          fontFamily: "Share Tech Mono, monospace",
        },
        appendToBody: true,
        extraCssText: "z-index: 20",
        formatter: (params: unknown) => {
          const p = params as { value: [number, number] };
          if (!p?.value) return "";
          const [flow, yVal] = p.value;
          const isIn = flow >= 0;
          const direction = isIn ? "◀ In" : "▶ Out";
          const color = isIn ? c.info : c.critical;
          const d = formatDepth(yVal, settings.unitSystem);
          const label = mode === "depth" ? `${d.value} ${d.unit}` : minutesToHHMM(yVal);
          return [
            `<span style="color:${c.fgDim}">${label}</span>`,
            `<span style="color:${color}">${direction}: ${Math.abs(flow).toFixed(1)} gpm</span>`,
          ].join("<br/>");
        },
      },
    };
  }, [mode, yRange.min, yRange.max, settings.unitSystem, fsScale]);

  useEffect(() => {
    if (!showLive) return;
    const ec = chartRef.current?.getEchartsInstance();
    if (!ec) return;

    ec.setOption(buildOption(), { lazyUpdate: true });

    const flush = () => {
      pendingRaf.current = null;
      const inst = chartRef.current?.getEchartsInstance();
      if (!inst) return;
      inst.setOption(buildOption(), { lazyUpdate: true });
    };

    const unsubscribe = globalRigStore.subscribe(
      (s) => s.drillStream,
      () => {
        if (pendingRaf.current !== null) return;
        pendingRaf.current = requestAnimationFrame(flush);
      },
    );

    return () => {
      unsubscribe();
      if (pendingRaf.current !== null) {
        cancelAnimationFrame(pendingRaf.current);
        pendingRaf.current = null;
      }
    };
  }, [buildOption, showLive]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 60 }}
    >
      <div className="px-1.5 h-10 flex flex-col justify-center border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading block">Flow</span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-critical)">
            out
          </span>
          <div className="w-px h-2.5 bg-(--theme-border)" />
          <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-info)">
            in
          </span>
        </div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col items-center justify-center gap-1.5">
        <span className="font-['Share_Tech_Mono',monospace] text-xs uppercase tracking-widest text-(--theme-fg-dim) opacity-60">
          Δ gpm
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-['Share_Tech_Mono',monospace] text-fs-9 tabular-nums text-(--theme-critical)">
            -{FLOW_SCALE}
          </span>
          <div className="w-px h-3 bg-(--theme-border)" />
          <span className="font-['Share_Tech_Mono',monospace] text-fs-9 tabular-nums text-(--theme-info)">
            +{FLOW_SCALE}
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-(--theme-border) z-10" />
        {!isLive ? (
          <ChartPlaceholder text="No live feed for this well" />
        ) : status !== "ONLINE" ? (
          <ChartPlaceholder text="Connecting…" />
        ) : (
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={{}}
            style={{ width: "100%", height: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge={false}
            lazyUpdate
          />
        )}
      </div>
    </div>
  );
}

function ChartPlaceholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-dim) uppercase tracking-[0.1em]">
        {text}
      </span>
    </div>
  );
}
