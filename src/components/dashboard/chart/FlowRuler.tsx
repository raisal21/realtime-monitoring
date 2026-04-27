import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { FLOW_DATA } from "@/data/dashboard-static";
import { useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const KICK_THRESHOLD = 0.1;

export function FlowRuler() {
  const { state: settings } = useSettings();

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();

    const maxFlow = Math.max(...FLOW_DATA.map((d) => Math.max(d.flowIn, d.flowOut)));
    const depths = FLOW_DATA.map((d) => d.depth);

    const outData = FLOW_DATA.map((d) => {
      const max = Math.max(d.flowIn, d.flowOut);
      const diff = Math.abs(d.flowIn - d.flowOut) / max;
      const isKick = diff > KICK_THRESHOLD && d.flowOut > d.flowIn;
      return {
        value: -d.flowOut,
        itemStyle: {
          color: isKick
            ? { type: "linear", x: 1, y: 0, x2: 0, y2: 0,
                colorStops: [
                  { offset: 0, color: c.critical },
                  { offset: 1, color: c.warning },
                ],
              }
            : c.critical,
          opacity: isKick ? 1 : 0.75,
        },
      };
    });

    const inData = FLOW_DATA.map((d) => {
      const max = Math.max(d.flowIn, d.flowOut);
      const diff = Math.abs(d.flowIn - d.flowOut) / max;
      const isKick = diff > KICK_THRESHOLD && d.flowIn > d.flowOut;
      return {
        value: d.flowIn,
        itemStyle: {
          color: isKick
            ? { type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: c.info },
                  { offset: 1, color: c.accent },
                ],
              }
            : c.info,
          opacity: isKick ? 1 : 0.75,
        },
      };
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
        min: -maxFlow,
        max: maxFlow,
        show: false,
        splitLine: {
          show: true,
          lineStyle: { color: c.border, width: 0.5 },
        },
      },
      yAxis: {
        type: "category",
        data: depths,
        inverse: true,
        show: false,
      },
      series: [
        {
          type: "bar",
          data: outData,
          barWidth: "80%",
          barGap: "-100%",
          label: { show: false },
          emphasis: { disabled: true },
        },
        {
          type: "bar",
          data: inData,
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
        formatter: (params: unknown) => {
          const ps = params as Array<{ dataIndex: number }>;
          if (!ps?.[0]) return "";
          const d = FLOW_DATA[ps[0].dataIndex];
          if (!d) return "";
          const max = Math.max(d.flowIn, d.flowOut);
          const diff = Math.abs(d.flowIn - d.flowOut) / max;
          const kickMark = diff > KICK_THRESHOLD ? ` <span style="color:${c.warning}">⚠ KICK</span>` : "";
          return [
            `<span style="color:${c.fgDim}">${d.depth} ft</span>${kickMark}`,
            `<span style="color:${c.critical}">▶ Out</span> <span style="color:${c.fg}">${d.flowOut}</span>`,
            `<span style="color:${c.info}">◀ In</span>&nbsp; <span style="color:${c.fg}">${d.flowIn}</span>`,
          ].join("<br/>");
        },
      },
    };
  }, [settings.theme]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 60 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
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
