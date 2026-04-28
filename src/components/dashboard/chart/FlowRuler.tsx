import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION } from "@/data/dashboard-static";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const minutesToHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const FLOW_SCALE = Math.ceil(
  Math.max(...WELL_SESSION.flow.map((d) => Math.abs(d.flow))) * 1.15,
);

export function FlowRuler() {
  const { state: chart } = useChart();
  const { state: settings } = useSettings();

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const mode = chart.mode;
    const range = chart.manualRange;

    const allFlowValues = WELL_SESSION.flow.map((d) => ({ value: d.flow, depth: d.depth }));

    let flowValues: typeof allFlowValues;
    let yAxisCategories: string[];

    if (mode === "depth") {
      flowValues = range
        ? allFlowValues.filter(f => f.depth >= range.min && f.depth <= range.max)
        : allFlowValues;
      yAxisCategories = flowValues.map(f => String(f.depth));
    } else {
      const timeEntries = WELL_SESSION.timePoints.map((t, i) => ({ t, i }));
      const filtered = range ? timeEntries.filter(({ t }) => t >= range.min && t <= range.max) : timeEntries;
      flowValues = filtered.map(({ i }) => allFlowValues[i] ?? { value: 0, depth: 0 });
      yAxisCategories = filtered.map(({ t }) => minutesToHHMM(t));
    }

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
      yAxis: {
        type: "category",
        data: yAxisCategories,
        inverse: true,
        show: false,
      },
      series: [
        {
          type: "bar",
          data: flowValues.map(f => ({
            value: f.value,
            itemStyle: { color: f.value >= 0 ? c.info : c.critical, opacity: 0.85 },
          })),
          barWidth: "80%",
          label: { show: false },
          emphasis: { disabled: true },
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
          fontSize: 9,
          fontFamily: "Share Tech Mono, monospace",
        },
        appendToBody: true,
        extraCssText: "z-index: 20",
        formatter: (params: unknown) => {
          const ps = params as Array<{ dataIndex: number }>;
          if (!ps?.[0]) return "";
          const f = flowValues[ps[0].dataIndex];
          if (!f) return "";
          const isIn = f.value >= 0;
          const direction = isIn ? "◀ In" : "▶ Out";
          const color = isIn ? c.info : c.critical;
          const label = mode === "depth"
            ? `${f.depth} ft`
            : minutesToHHMM(WELL_SESSION.timePoints[ps[0].dataIndex]);
          return [
            `<span style="color:${c.fgDim}">${label}</span>`,
            `<span style="color:${color}">${direction}: ${Math.abs(f.value)}</span>`,
          ].join("<br/>");
        },
      },
    };
  }, [chart.mode, chart.manualRange, settings.theme]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 60 }}
    >
      <div className="px-1.5 h-10 flex flex-col justify-center border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Flow</span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-critical)">
            out
          </span>
          <div className="w-px h-2.5 bg-(--theme-border)" />
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-info)">
            in
          </span>
        </div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col items-center justify-center gap-1.5">
        <span className="font-['Share_Tech_Mono',monospace] text-[7px] uppercase tracking-widest text-(--theme-fg-dim) opacity-60">
          scale
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-['Share_Tech_Mono',monospace] text-[9px] tabular-nums text-(--theme-critical)">
            -{FLOW_SCALE}
          </span>
          <div className="w-px h-3 bg-(--theme-border)" />
          <span className="font-['Share_Tech_Mono',monospace] text-[9px] tabular-nums text-(--theme-info)">
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
