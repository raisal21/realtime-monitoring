import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_PROFILE_DATA } from "@/data/dashboard-static";
import { useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const MAX_DEPTH = 15200;
const CURRENT_DEPTH = 12563;

export function WellProfileTrack() {
  const { state: settings } = useSettings();

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();

    const dates = WELL_PROFILE_DATA.map((d) => d.date);
    const depths = WELL_PROFILE_DATA.map((d) => d.depth);

    return {
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
      yAxis: {
        type: "value",
        inverse: true,
        min: 0,
        max: MAX_DEPTH,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
      },
      series: [
        {
          type: "line",
          data: depths,
          smooth: 0.4,
          symbol: "none",
          lineStyle: { color: c.accent, width: 1.5, opacity: 0.9 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${c.accent}30` },
                { offset: 1, color: `${c.accent}06` },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ yAxis: CURRENT_DEPTH }],
            lineStyle: { color: c.accent, width: 1, type: "solid", opacity: 0.7 },
            label: {
              show: true,
              position: "insideEndTop",
              formatter: `{c} ft`,
              color: c.accent,
              fontSize: 8,
              fontFamily: "Share Tech Mono, monospace",
              backgroundColor: c.surface,
              padding: [1, 3],
            },
          },
          endLabel: {
            show: true,
            formatter: `${CURRENT_DEPTH.toLocaleString()}`,
            color: c.accent,
            fontSize: 8,
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
          fontSize: 10,
          fontFamily: "Share Tech Mono, monospace",
        },
        formatter: (params: unknown) => {
          const ps = params as Array<{ name: string; value: number }>;
          if (!ps?.[0]) return "";
          const { name, value } = ps[0];
          return `<span style="color:${c.fgMuted}">${name}</span>&nbsp;&nbsp;<span style="color:${c.accent};font-weight:600">${value.toLocaleString()} ft</span>`;
        },
      },
    };
  // settings.theme triggers re-compute when theme changes
  }, [settings.theme]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 overflow-hidden",
        "bg-(--theme-surface)",
        "border-r-2 border-r-(--theme-border)",
      )}
      style={{ width: 130 }}
    >
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
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
        />
      </div>

      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-muted) tabular">
          {MAX_DEPTH.toLocaleString()} ft
        </span>
      </div>
    </div>
  );
}
