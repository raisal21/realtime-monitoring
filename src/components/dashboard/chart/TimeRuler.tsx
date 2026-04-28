import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION } from "@/data/dashboard-static";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

function pixelToTimeValue(pct: number): number {
  const { min, max } = WELL_SESSION.timeAxis.range;
  return min + pct * (max - min);
}

const minutesToHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export function TimeRuler({ isPrimary }: { isPrimary: boolean }) {
  const { dispatch: chartDispatch } = useChart();
  const { state: settings } = useSettings();

  const handleMouseMove = isPrimary
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientY - rect.top) / rect.height;
        chartDispatch({
          type: "SET_CROSSHAIR_VALUE",
          value: pixelToTimeValue(Math.max(0, Math.min(1, pct))),
        });
      }
    : undefined;

  const handleMouseLeave = isPrimary
    ? () => chartDispatch({ type: "SET_CROSSHAIR_VALUE", value: null })
    : undefined;

  const { min: rangeMin, max: rangeMax } = WELL_SESSION.timeAxis.range;

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
          crossStyle: {
            color: tickColor,
            width: 1,
            type: "dashed",
          },
        },
      },
      xAxis: { type: "value", show: false, min: 0, max: 1 },
      yAxis: {
        type: "value",
        min: rangeMin,
        max: rangeMax,
        inverse: true,
        position: "left",
        interval: 5,
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
          formatter: (val: number) => (val % 10 === 0 ? minutesToHHMM(val) : ""),
        },
        splitLine: { show: false },
      },
      series: [],
    };
  }, [settings.theme, isPrimary, rangeMin, rangeMax]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
        isPrimary && "border-r-(--theme-accent)",
      )}
      style={{ width: 52 }}
    >
      <div className="px-1.5 h-10 flex flex-col justify-center border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading block",
            isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
          )}
        >
          Time
        </span>
        <div className="label-mono mt-0.5">UTC</div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col">
        <div className="flex items-center pt-2 pb-1">
          <div className={cn("w-1.5 h-px flex-shrink-0", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)")} />
          <span className={cn("font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1", isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)")}>
            {minutesToHHMM(rangeMin)}
          </span>
        </div>
        <div className="flex flex-1">
          <div className={cn("w-px ml-[3px]", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-border)")} style={{ opacity: 0.35 }} />
        </div>
        <div className="flex items-center pt-1 pb-2">
          <div className={cn("w-1.5 h-px flex-shrink-0", isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)")} />
          <span className={cn("font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1", isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)")}>
            {minutesToHHMM(rangeMax)}
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
        />
      </div>
    </div>
  );
}
