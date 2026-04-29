import { useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION } from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

export function WellProfileTrack() {
  const { state: chart, dispatch } = useChart();
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];

  const handleDataZoom = useCallback(
    (params: unknown) => {
      const p = params as {
        startValue?: number;
        endValue?: number;
        batch?: Array<{ startValue?: number; endValue?: number }>;
      };
      const raw = (p.batch?.[0] ?? p) as {
        startValue?: number;
        endValue?: number;
      };
      if (raw.startValue !== undefined && raw.endValue !== undefined) {
        dispatch({
          type: "SET_MANUAL_RANGE",
          min: Math.min(raw.startValue, raw.endValue),
          max: Math.max(raw.startValue, raw.endValue),
        });
      }
    },
    [dispatch],
  );

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const { data, maxDepthFt } = WELL_SESSION.wellProfile;
    const { depthFt: currentDepthFt } = WELL_SESSION.cursor;

    const dates = data.map((d) => d.date);
    const depths = data.map((d) => d.depth);

    const opt: EChartsOption = {
      animation: false,
      backgroundColor: c.surface,
      grid: {
        top: 4,
        bottom: 4,
        left: 0,
        right: 0,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
      },
      yAxis: [
        {
          type: "value",
          inverse: true,
          min: 0,
          max: maxDepthFt,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: {
            show: true,
            lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
          },
        },
        {
          type: "value",
          inverse: true,
          min: 0,
          max: maxDepthFt,
          show: false,
        },
      ],
      series: [
        {
          type: "line",
          yAxisIndex: 0,
          data: depths,
          step: "end" as const,
          symbol: "none",
          lineStyle: { color: c.accent, width: 1.5, opacity: 0.95 },
          endLabel: {
            show: true,
            formatter: `${currentDepthFt.toLocaleString()}`,
            color: c.accent,
            fontSize: 8 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            backgroundColor: c.surface,
            padding: [1, 3],
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: c.elevated,
        borderColor: c.border,
        borderWidth: 1,
        padding: [5, 8],
        textStyle: {
          color: c.fg,
          fontSize: 10 * fsScale,
          fontFamily: "Share Tech Mono, monospace",
        },
        appendToBody: true,
        extraCssText: "z-index: 20",
        formatter: (params: unknown) => {
          const ps = params as Array<{ name: string; value: number }>;
          if (!ps?.[0]) return "";
          const { name, value } = ps[0];
          return `<span style="color:${c.fgMuted}">${name}</span>&nbsp;&nbsp;<span style="color:${c.accent};font-weight:600">${value.toLocaleString()} ft</span>`;
        },
      },
      dataZoom:
        chart.dataZoomSlider && !chart.liveMode
          ? [
              {
                type: "inside" as const,
                yAxisIndex: 1,
                filterMode: "none" as const,
                zoomOnMouseWheel: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: true,
              },
              {
                type: "slider" as const,
                yAxisIndex: 1,
                orient: "vertical" as const,
                left: 0,
                right: 0,
                width: 120,
                handleSize: 30,
                borderColor: "transparent",
                backgroundColor: "transparent",
                fillerColor: c.accent + "50",
                handleStyle: {
                  color: c.accent,
                  borderWidth: 1,
                  borderRadius: 0,
                },
                filterMode: "none" as const,
                showDataShadow: false,
                showDetail: false,
              },
            ]
          : [
              {
                type: "inside" as const,
                yAxisIndex: 1,
                filterMode: "none" as const,
                zoomOnMouseWheel: false,
                moveOnMouseMove: true,
                moveOnMouseWheel: true,
              },
            ],
    };

    return opt;
  }, [settings.theme, chart.dataZoomSlider, chart.manualRange, fsScale]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 overflow-hidden",
        "bg-(--theme-surface)",
        "border-r-2 border-r-(--theme-border)",
      )}
      style={{ width: 130 }}
    >
      <div className="px-2 h-10 flex flex-col justify-center border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Well Profile</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="label-mono">depth × time</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>

      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-muted) tabular">
          {WELL_SESSION.wellProfile.maxDepthFt.toLocaleString()} ft
        </span>
      </div>
    </div>
  );
}
