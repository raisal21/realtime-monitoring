import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  WELL_SESSION,
  PRESET_TO_MINUTES,
  presetToDepthSpanM,
} from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/app-store";
import { getChartColors } from "@/lib/echarts-theme";
import { formatDepth } from "@/lib/units";
import { cn } from "@/lib/utils";

const minutesToHHMM = (min: number) => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.floor(wrapped % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const FLOW_SCALE = Math.max(
  10,
  Math.ceil(Math.max(...WELL_SESSION.flow.map((d) => Math.abs(d.flow))) * 1.15),
);

export function FlowRuler() {
  const { state: chart } = useChart();
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];

  // Mirror LogTrack's yRange logic so flow bars stay vertically aligned with
  // the active ruler (Time / Depth) under live, preset, and zoom states.
  const sessionRange =
    chart.mode === "depth"
      ? WELL_SESSION.depthAxis.range
      : WELL_SESSION.timeAxis.range;
  let yRange: { min: number; max: number };
  if (chart.liveMode) {
    if (chart.mode === "depth") {
      const cur = WELL_SESSION.cursor.depthM;
      const span = chart.rangePreset
        ? presetToDepthSpanM(chart.rangePreset)
        : 30;
      yRange = { min: Math.max(sessionRange.min, cur - span), max: cur };
    } else {
      const span = chart.rangePreset
        ? PRESET_TO_MINUTES[chart.rangePreset] ?? 60
        : 60;
      yRange = {
        min: Math.max(sessionRange.min, sessionRange.max - span),
        max: sessionRange.max,
      };
    }
  } else {
    yRange =
      chart.logTrackRange ??
      chart.rulerRange ?? { min: sessionRange.min, max: sessionRange.max };
  }

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const mode = chart.mode;
    const samples = WELL_SESSION.flow;

    // Filter samples by visible window. Depth is non-monotonic (drill / trip
    // cycles can revisit the same depth band), so multiple samples may hit
    // the same depth slice — that is intentional and renders as stacked bars.
    const inRange =
      mode === "depth"
        ? samples.filter(
            (s) => s.depth >= yRange.min && s.depth <= yRange.max,
          )
        : samples.filter((s) => s.time >= yRange.min && s.time <= yRange.max);

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
          data: inRange.map((s) => [
            s.flow,
            mode === "depth" ? s.depth : s.time,
          ]),
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
  }, [chart.mode, yRange.min, yRange.max, settings.theme, fsScale]);

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
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </div>
    </div>
  );
}
