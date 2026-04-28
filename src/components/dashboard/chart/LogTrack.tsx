import { useMemo, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { TRACK_TRACES, WELL_SESSION } from "@/data/dashboard-static";
import { Badge } from "@/components/core";
import { getChartColors, getTraceColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

interface LogTrackProps {
  trackId: keyof typeof TRACK_TRACES;
  title: string;
  hz: string;
  stream: "drill" | "geo";
}


interface TrackHeaderProps {
  traces: typeof TRACK_TRACES[keyof typeof TRACK_TRACES];
  traceColors: ReturnType<typeof getTraceColors>;
  traceVisibility: Record<string, boolean>;
  onToggle: (trace: string) => void;
}

function TrackHeader({ traces, traceColors, traceVisibility, onToggle }: TrackHeaderProps) {
  return (
    <div className="flex-shrink-0 min-h-[72px] border-b border-(--theme-border)">
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

  const echartsRef = useRef<ReactECharts>(null);
  const wasRemote = useRef(false);

  useEffect(() => {
    const ec = echartsRef.current?.getEchartsInstance();
    if (!ec) return;

    const { crosshairValue } = chart;

    if (crosshairValue !== null) {
      const localTraces = traces.filter((t) => chart.traceVisibility[t.trace]);
      if (!localTraces.length) return;

      const coords = ec.convertToPixel(
        { xAxisIndex: 0, yAxisIndex: 0 },
        [localTraces[0].min, crosshairValue],
      );
      if (!coords) return;

      const pixelX = ec.getWidth() / 2;
      const pixelY = (coords as number[])[1];
      ec.dispatchAction({ type: "showTip", x: pixelX, y: pixelY });

      if (!wasRemote.current) {
        ec.setOption({ tooltip: { axisPointer: { label: { show: false } } } });
        wasRemote.current = true;
      }
    } else if (wasRemote.current) {
      // globalout clears both the tooltip popup and the crosshair lines;
      // hideTip alone only hides the popup, leaving the crossStyle stuck
      ec.getZr().trigger('globalout', {});
      ec.setOption({ tooltip: { axisPointer: { label: { show: true } } } });
      wasRemote.current = false;
    }
  }, [chart.crosshairValue, chart.traceVisibility, traces]);

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const tc = getTraceColors();
    const mode = chart.mode;

    const visibleTraces = traces.filter((t) => chart.traceVisibility[t.trace]);
    const trackData = WELL_SESSION.traces[trackId] as Record<string, readonly number[]>;

    const yPoints = mode === "depth" ? WELL_SESSION.depthPoints : WELL_SESSION.timePoints;

    const series = visibleTraces.map((t, idx) => {
      const values = trackData[t.trace] ?? [];
      const data = values.map((val, i) => [val, yPoints[i]]);
      const color = tc[t.trace as keyof typeof tc] || c.fgMuted;
      return {
        type: "line" as const,
        xAxisIndex: idx,
        yAxisIndex: 0,
        data,
        smooth: false,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color, width: 1.5, opacity: 0.95 },
        itemStyle: { color, borderColor: c.base, borderWidth: 1.5 },
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
          axisPointer: { label: { show: false } },
        }))
      : [{ type: "value" as const, show: false, min: 0, max: 1 }];

    const yRange = mode === "depth"
      ? WELL_SESSION.depthAxis.range
      : WELL_SESSION.timeAxis.range;

    return {
      animation: false,
      backgroundColor: c.base,
      grid: { top: 4, bottom: 4, left: 6, right: 6, containLabel: false },
      xAxis: xAxes,
      yAxis: {
        type: "value",
        inverse: true,
        min: yRange.min,
        max: yRange.max,
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
          axis: "y" as const,
          crossStyle: { color: c.fgDim, width: 0.8 },
          lineStyle: { color: c.accent, width: 0.8, type: "dashed" },
          label: {
            backgroundColor: c.accent,
            color: c.fg,
            borderWidth: 0,
            fontSize: 8,
            fontFamily: "Share Tech Mono, monospace",
            padding: [3, 6],
            formatter: mode === "depth"
              ? (params: { value: number | string | Date }) => `${Math.round(Number(params.value))} ft`
              : (params: { value: number | string | Date }) => {
                  const min = Number(params.value);
                  const h = Math.floor(min / 60);
                  const m = Math.floor(min % 60);
                  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                },
          },
        },
        backgroundColor: c.elevated,
        borderColor: c.border,
        borderWidth: 1,
        padding: [6, 10],
        appendToBody: true,
        extraCssText: "z-index: 20",
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
  }, [traces, chart.traceVisibility, chart.mode, settings.theme]);

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
      <div className="px-2 h-10 flex items-center gap-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">{title}</span>
        <Badge intent="neutral" size="xs">{hz}</Badge>
      </div>

      <TrackHeader
        traces={traces}
        traceColors={tc}
        traceVisibility={chart.traceVisibility}
        onToggle={(trace) => dispatch({ type: "TOGGLE_TRACE_VISIBILITY", trace })}
      />

      <div className="relative flex-1 overflow-hidden">
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </div>
    </div>
  );
}
