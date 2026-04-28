import { useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION } from "@/data/dashboard-static";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const DEFAULT_DEPTH_SPAN = 100;

function pixelToDepthValue(pct: number): number {
  const { min, max } = WELL_SESSION.depthAxis.range;
  return min + pct * (max - min);
}

function getEffectiveRange(
  isPrimary: boolean,
  liveMode: boolean,
  manualRange: { min: number; max: number } | null,
  sessionMin: number,
  sessionMax: number,
) {
  if (!isPrimary) return { min: sessionMin, max: sessionMax };
  if (liveMode) {
    const currentDepth = WELL_SESSION.cursor.depthFt;
    const start = Math.max(sessionMin, currentDepth - DEFAULT_DEPTH_SPAN);
    const end = currentDepth;
    return { min: start, max: end };
  }
  return manualRange ?? { min: sessionMin, max: sessionMax };
}

export function DepthRuler({ isPrimary }: { isPrimary: boolean }) {
  const { state: chart, dispatch: chartDispatch } = useChart();
  const { state: settings } = useSettings();

  const handleDataZoom = useCallback((params: unknown) => {
    const p = params as { startValue?: number; endValue?: number; batch?: Array<{ startValue?: number; endValue?: number }> };
    const raw = (p.batch?.[0] ?? p) as { startValue?: number; endValue?: number };
    if (raw.startValue !== undefined && raw.endValue !== undefined) {
      chartDispatch({
        type: "SET_MANUAL_RANGE",
        min: Math.min(raw.startValue, raw.endValue),
        max: Math.max(raw.startValue, raw.endValue),
      });
    }
  }, [chartDispatch]);

  const handleMouseMove = isPrimary
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientY - rect.top) / rect.height;
        chartDispatch({
          type: "SET_CROSSHAIR_VALUE",
          value: pixelToDepthValue(Math.max(0, Math.min(1, pct))),
        });
      }
    : undefined;

  const handleMouseLeave = isPrimary
    ? () => chartDispatch({ type: "SET_CROSSHAIR_VALUE", value: null })
    : undefined;

  const { min: sessionMin, max: sessionMax } = WELL_SESSION.depthAxis.range;
  const yRange = getEffectiveRange(
    isPrimary,
    chart.liveMode,
    chart.manualRange,
    sessionMin,
    sessionMax,
  );

  const showDataZoomSlider = isPrimary && chart.dataZoomSlider && !chart.liveMode;

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const tickColor = isPrimary ? c.accent : c.fgDim;
    const labelColor = isPrimary ? c.fgMuted : c.fgDim;

    return {
      animation: false,
      backgroundColor: c.base,
      grid: { top: 0, bottom: 0, left: 0, right: 4, containLabel: false },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: { show: false },
          lineStyle: { width: 0 },
          crossStyle: { color: tickColor, width: 1, type: "dashed" },
        },
      },
      xAxis: { type: "value", show: false, min: 0, max: 1 },
      yAxis: [
        {
          type: "value",
          min: yRange.min,
          max: yRange.max,
          inverse: true,
          position: "left",
          interval: 10,
          axisLine: { show: false },
          axisTick: {
            show: true,
            inside: true,
            length: 6,
            lineStyle: { color: tickColor, width: 1 },
          },
          axisLabel: {
            inside: true,
            margin: 8,
            fontSize: 8,
            fontFamily: "Share Tech Mono, monospace",
            color: labelColor,
            formatter: (val: number) => (val % 20 === 0 ? String(val) : ""),
          },
          splitLine: { show: false },
        },
        {
          type: "value",
          min: yRange.min,
          max: yRange.max,
          inverse: true,
          show: false,
        },
      ],
      dataZoom: showDataZoomSlider
        ? [
            { type: "inside", yAxisIndex: 1, filterMode: "none", zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: true },
            {
              type: "slider",
              yAxisIndex: 1,
              orient: "vertical",
              left: 0,
              right: 0,
              width: 48,
              handleSize: 30,
              borderColor: "transparent",
              backgroundColor: "transparent",
              fillerColor: c.accent + "50",
              handleStyle: {
                color: c.accent,
                borderWidth: 1,
                borderRadius: 0,
              },
              filterMode: "none",
              showDataShadow: false,
              showDetail: false,
            },
          ]
        : [{ type: "inside", yAxisIndex: 1, filterMode: "none", zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: true }],
      series: [],
    };
  }, [settings.theme, isPrimary, yRange.min, yRange.max, showDataZoomSlider, chart.manualRange]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
        isPrimary && "border-r-(--theme-accent)",
      )}
      style={{ width: 58 }}
    >
      <div className="px-1.5 h-10 flex flex-col justify-center border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading block",
            isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
          )}
        >
          Depth
        </span>
        <div className="label-mono mt-0.5">ft MD</div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col">
        <div className="flex items-center pt-2 pb-1">
          <div className={cn("w-1.5 h-px flex-shrink-0", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)")} />
          <span className={cn("font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1", isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)")}>
            {yRange.min.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-1">
          <div className={cn("w-px ml-[3px]", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-border)")} style={{ opacity: 0.35 }} />
        </div>
        <div className="flex items-center pt-1 pb-2">
          <div className={cn("w-1.5 h-px flex-shrink-0", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)")} />
          <span className={cn("font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1", isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)")}>
            {yRange.max.toLocaleString()}
          </span>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>
    </div>
  );
}
