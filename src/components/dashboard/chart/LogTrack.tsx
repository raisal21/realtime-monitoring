import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { TRACK_TRACES } from "@/data/dashboard-static";
import { Badge } from "@/components/core";
import { getChartColors, getTraceColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

interface LogTrackProps {
  trackId: keyof typeof TRACK_TRACES;
  title: string;
  hz: string;
  stream: "drill" | "geo";
}

function generateMockData(traceIndex: number, length = 80) {
  return Array.from({ length }, (_, i) => {
    const t = i / (length - 1);
    return (
      0.3 +
      0.4 * t +
      0.15 * Math.sin(t * Math.PI * 6 + traceIndex * 2.1) +
      0.08 * Math.cos(t * Math.PI * 14 + traceIndex * 1.3) +
      0.04 * Math.sin(t * Math.PI * 28 + traceIndex * 0.7)
    );
  });
}

interface TrackHeaderProps {
  traces: typeof TRACK_TRACES[keyof typeof TRACK_TRACES];
  traceColors: ReturnType<typeof getTraceColors>;
  traceVisibility: Record<string, boolean>;
  onToggle: (trace: string) => void;
}

function TrackHeader({ traces, traceColors, traceVisibility, onToggle }: TrackHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-(--theme-border)">
      {traces.map((t) => {
        const color = traceColors[t.trace as keyof typeof traceColors] || "var(--theme-fg-dim)";
        const visible = traceVisibility[t.trace];
        return (
          <button
            key={t.trace}
            onClick={() => onToggle(t.trace)}
            title={visible ? `Hide ${t.name}` : `Show ${t.name}`}
            className={cn(
              "w-full flex items-center gap-1.5 px-2 h-6 cursor-pointer",
              "border-t border-(--theme-border-subtle) first:border-t-0",
              "hover:bg-(--theme-elevated) transition-colors",
            )}
          >
            <div
              className="h-[1.5px] w-3.5 flex-shrink-0 rounded-full transition-opacity"
              style={{
                backgroundColor: color,
                opacity: visible ? 1 : 0.25,
              }}
            />
            <span
              className="font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider flex-1 truncate text-left transition-opacity"
              style={{
                color,
                opacity: visible ? 1 : 0.35,
              }}
            >
              {t.name}
            </span>
            <span
              className="font-['Share_Tech_Mono',monospace] text-[9px] tabular-nums transition-opacity"
              style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
            >
              {t.min}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-border) mx-0.5">──</span>
            <span
              className="font-['Share_Tech_Mono',monospace] text-[9px] tabular-nums transition-opacity"
              style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
            >
              {t.max}
            </span>
            <span
              className="font-['Share_Tech_Mono',monospace] text-[9px] ml-0.5 truncate max-w-[32px] transition-opacity"
              style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
            >
              {t.unit}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LogTrack({ trackId, title, hz, stream }: LogTrackProps) {
  const { state: chart, dispatch } = useChart();
  const { state: settings } = useSettings();
  const traces = TRACK_TRACES[trackId];
  const tc = getTraceColors();

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const tc = getTraceColors();
    const yData = Array.from({ length: 80 }, (_, i) => i);

    const visibleTraces = traces.filter((t) => chart.traceVisibility[t.trace]);

    const series = visibleTraces.map((t, idx) => {
      const raw = generateMockData(idx);
      const data = raw.map((norm, i) => [t.min + norm * (t.max - t.min), yData[i]]);
      const color = tc[t.trace as keyof typeof tc] || c.fgMuted;
      return {
        type: "line" as const,
        xAxisIndex: idx,
        yAxisIndex: 0,
        data,
        smooth: false,
        symbol: "none",
        lineStyle: { color, width: 1.2, opacity: 0.9 },
        itemStyle: { color },
        z: 10 - idx,
      };
    });

    const xAxes = visibleTraces.length > 0
      ? visibleTraces.map((t, idx) => ({
          type: "value" as const,
          min: t.min,
          max: t.max,
          position: "top" as const,
          offset: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { 
            show: idx === 0,
            lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" as const },
          },
          splitNumber: 4,
        }))
      : [{ type: "value" as const, show: false, min: 0, max: 1 }];

    return {
      animation: false,
      backgroundColor: c.base,
      grid: { top: 4, bottom: 4, left: 6, right: 6, containLabel: false },
      xAxis: xAxes,
      yAxis: {
        type: "value",
        inverse: true,
        min: 0,
        max: 79,
        show: false,
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: { color: c.fgDim, width: 0.8 },
          lineStyle: { color: c.accent, width: 0.8, type: "dashed" },
        },
        backgroundColor: c.elevated,
        borderColor: c.border,
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: c.fg, fontSize: 10, fontFamily: "Share Tech Mono, monospace" },
        formatter: (params: unknown) => {
          const ps = params as Array<{ value: [number, number] }>;
          if (!ps?.length) return "";
          return ps
            .map((p, i) => {
              const t = visibleTraces[i];
              if (!t) return "";
              const color = tc[t.trace as keyof typeof tc] || c.fgMuted;
              return `<span style="color:${color}">■</span> <span style="color:${c.fgMuted}">${t.name}</span> <span style="color:${c.fg};font-weight:600">${p.value[0].toFixed(1)}</span> <span style="color:${c.fgDim}">${t.unit}</span>`;
            })
            .filter(Boolean)
            .join("<br/>");
        },
      },
      series,
    };
  // settings.theme in deps ensures re-compute when theme changes (getChartColors reads CSS vars at call time)
  }, [traces, chart.traceVisibility, settings.theme]);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-[180px]",
        "border-r border-(--theme-border) last:border-r-0",
        "bg-(--theme-base) overflow-hidden",
        stream === "drill"
          ? "shadow-[inset_2px_0_0_var(--theme-ok)]"
          : "shadow-[inset_2px_0_0_var(--theme-info)]",
      )}
    >
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="section-heading flex-1">{title}</span>
          <Badge intent="neutral" size="xs">{hz}</Badge>
        </div>
      </div>

      <TrackHeader
        traces={traces}
        traceColors={tc}
        traceVisibility={chart.traceVisibility}
        onToggle={(trace) => dispatch({ type: "TOGGLE_TRACE_VISIBILITY", trace })}
      />

      <div className="relative flex-1 overflow-hidden">
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
