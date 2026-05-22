import { useMemo, useRef, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE, TRACKS_META } from "@/store/app-store";
import { TRACK_TRACES } from "@/data/dashboard-static";
import { Badge } from "@/components/ui/core";
import { getChartColors, getTraceColors } from "@/lib/echarts-theme";
import { formatDepth, formatQuantityBounds } from "@/lib/units";
import { cn } from "@/lib/utils";
import { LIVE_WELL_ID } from "@/data/wells";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import {
  getViewport,
  type ViewportSession,
} from "@/lib/chart-viewport";
import { getTickCount } from "@/lib/chart-ticks";
import type { GlobalRigState } from "@/store/store.types";
import type { DrillUpdate, GeoUpdate } from "@/domain/message.types";
import type { StreamRing } from "@/lib/stream-ring";
import { binMinMax, type EnvelopePoint } from "@/lib/bin-mm";

interface LogTrackProps {
  trackId: keyof typeof TRACK_TRACES;
  title: string;
  hz: string;
  stream: "drill" | "geo";
}

type TraceEntry = typeof TRACK_TRACES[keyof typeof TRACK_TRACES][number];

function traceAxisDisplay(
  t: TraceEntry,
  unitSystem: "metric" | "imperial",
): { min: number; max: number; unit: string } {
  if (t.kind === "scalar") {
    return { min: t.minScalar, max: t.maxScalar, unit: t.unit };
  }

  const boundsMap: Record<string, { kind: "load" | "pressure" | "rop"; min: number; max: number }> = {
    load:     t.kind === "load"     ? { kind: "load",     min: t.minKN,   max: t.maxKN   } : undefined!,
    pressure: t.kind === "pressure" ? { kind: "pressure", min: t.minBar,  max: t.maxBar  } : undefined!,
    rop:      t.kind === "rop"      ? { kind: "rop",      min: t.minMHr,  max: t.maxMHr  } : undefined!,
  };
  const bounds = boundsMap[t.kind];
  return formatQuantityBounds(bounds, bounds.min, bounds.max, unitSystem);
}

interface TraceDisplay {
  trace: string;
  name: string;
  displayMin: string;
  displayMax: string;
  unit: string;
  axisMin: number;
  axisMax: number;
}

function resolveTraceDisplays(
  traces: readonly TraceEntry[],
  unitSystem: "metric" | "imperial",
): Map<string, TraceDisplay> {
  const map = new Map<string, TraceDisplay>();
  for (const t of traces) {
    const axis = traceAxisDisplay(t, unitSystem);
    map.set(t.trace, {
      trace: t.trace,
      name: t.name,
      displayMin: axis.min.toLocaleString(undefined, { maximumFractionDigits: t.kind === "scalar" ? 0 : 1 }),
      displayMax: axis.max.toLocaleString(undefined, { maximumFractionDigits: t.kind === "scalar" ? 0 : 1 }),
      unit: axis.unit,
      axisMin: axis.min,
      axisMax: axis.max,
    });
  }
  return map;
}

interface TrackHeaderProps {
  traces: typeof TRACK_TRACES[keyof typeof TRACK_TRACES];
  traceColors: ReturnType<typeof getTraceColors>;
  traceVisibility: Record<string, boolean>;
  onToggle: (trace: string) => void;
  compact?: boolean;
  unitSystem: "metric" | "imperial";
}

function TrackHeader({ traces, traceColors, traceVisibility, onToggle, compact, unitSystem }: TrackHeaderProps) {
  const displays = useMemo(
    () => resolveTraceDisplays(traces, unitSystem),
    [traces, unitSystem],
  );

  return (
    <div className="flex-shrink-0 min-h-[72px] border-b border-(--theme-border)">
      {traces.map((t) => {
        const d = displays.get(t.trace)!;
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
              className="font-['Share_Tech_Mono',monospace] text-fs-10 uppercase tracking-wider flex-1 truncate text-left transition-opacity"
              style={{
                color,
                opacity: visible ? 1 : 0.35,
              }}
            >
              {t.name}
            </span>
            <span
              className="font-['Share_Tech_Mono',monospace] text-fs-9 tabular-nums transition-opacity"
              style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
            >
              {d.displayMin}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-fs-9 text-(--theme-border) mx-0.5">──</span>
            <span
              className="font-['Share_Tech_Mono',monospace] text-fs-9 tabular-nums transition-opacity"
              style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
            >
              {d.displayMax}
            </span>
            {!compact && (
              <span
                className="font-['Share_Tech_Mono',monospace] text-fs-9 ml-0.5 truncate max-w-[32px] transition-opacity"
                style={{ color: "var(--theme-fg-dim)", opacity: visible ? 1 : 0.35 }}
              >
                {d.unit}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getStreamRing(
  state: GlobalRigState,
  stream: "drill" | "geo",
): StreamRing<DrillUpdate> | StreamRing<GeoUpdate> {
  return stream === "drill" ? state.drillRing : state.geoRing;
}

export function LogTrack({ trackId, title, hz, stream }: LogTrackProps) {
  const mode = useStore(globalRigStore, (s) => s.chart.mode);
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const logTrackRange = useStore(globalRigStore, (s) => s.chart.logTrackRange);
  const rulerRange = useStore(globalRigStore, (s) => s.chart.rulerRange);
  const trackWidths = useStore(globalRigStore, (s) => s.chart.trackWidths);
  const traceVisibility = useStore(
    globalRigStore,
    (s) => s.chart.traceVisibility,
  );
  const setLogTrackRange = useStore(
    globalRigStore,
    (s) => s.setLogTrackRange,
  );
  const toggleTraceVisibility = useStore(
    globalRigStore,
    (s) => s.toggleTraceVisibility,
  );
  const status = useStore(globalRigStore, (s) => s.status);
  const { well } = useCurrentWell();
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];
  const traces = TRACK_TRACES[trackId];
  const tc = getTraceColors();

  const isLive = well?.id === LIVE_WELL_ID;
  const showLive = isLive && status === "ONLINE";

  const chartRef = useRef<ReactECharts>(null);
  const pendingRaf = useRef<number | null>(null);

  const traceDisplays = useMemo(
    () => resolveTraceDisplays(traces, settings.unitSystem),
    [traces, settings.unitSystem],
  );

  const handleDataZoom = useCallback((params: unknown) => {
    const p = params as { startValue?: number; endValue?: number; batch?: Array<{ startValue?: number; endValue?: number }> };
    const raw = (p.batch?.[0] ?? p) as { startValue?: number; endValue?: number };
    if (raw.startValue !== undefined && raw.endValue !== undefined) {
      setLogTrackRange(
        Math.min(raw.startValue, raw.endValue),
        Math.max(raw.startValue, raw.endValue),
      );
    }
  }, [setLogTrackRange]);

  const buildOption = useCallback((): EChartsOption => {
    const c = getChartColors();
    const tcL = getTraceColors();
    const unitSystem = settings.unitSystem;
    const visibleTraces = traces.filter((t) => traceVisibility[t.trace]);

    const streamRing = getStreamRing(globalRigStore.getState(), stream);
    const drillRing = globalRigStore.getState().drillRing;
    const head = drillRing.first();
    const tail = drillRing.latest();

    let session: ViewportSession;
    if (mode === "depth") {
      const cursor = tail?.depth ?? 0;
      const minDepth = head?.depth ?? cursor;
      const dT = head && tail ? tail.timestamp - head.timestamp : 0;
      const ropMPerMin =
        dT > 0 && head && tail
          ? ((tail.depth - head.depth) / dT) * 60_000
          : 0.1;
      session = { min: minDepth, max: cursor, cursor, ropMPerMin };
    } else {
      const cursor = tail?.timestamp ?? Date.now();
      const min = head?.timestamp ?? cursor;
      session = { min, max: cursor, cursor };
    }

    const yRange = getViewport(
      { rangePreset, rulerRange, logTrackRange },
      session,
      true,
      mode,
    );
    const canvasH =
      chartRef.current?.getEchartsInstance()?.getHeight() ?? 600;
    const tickCount = getTickCount(canvasH);

    const convertVal = (t: typeof visibleTraces[number], v: number): number => {
      if (t.kind === "scalar") return v;
      if (t.kind === "load" && unitSystem === "imperial") return v / 4.4482216;
      if (t.kind === "pressure" && unitSystem === "imperial") return v / 0.0689476;
      if (t.kind === "rop" && unitSystem === "imperial") return v / 0.3048;
      return v;
    };

    const yKey = mode === "depth" ? "depth" : "timestamp";

    // BIN-MM envelope: each trace becomes a min line + a max line over
    // `tickCount` bins (~2× tickCount points total), replacing one polyline
    // point per raw sample. Decimation cost is independent of ring depth.
    const series = visibleTraces.flatMap((t, idx) => {
      const env = binMinMax(streamRing, t.trace, yKey, tickCount);
      const color = tcL[t.trace as keyof typeof tcL] || c.fgMuted;
      const toData = (pts: EnvelopePoint[]): [number, number][] =>
        pts.map(([v, y]) => [convertVal(t, v), y] as [number, number]);
      const line = {
        type: "line" as const,
        name: t.trace,
        xAxisIndex: idx,
        yAxisIndex: 0,
        smooth: false,
        showSymbol: false,
        lineStyle: { color, width: 1.5, opacity: 0.95 },
        itemStyle: { color },
        z: 10 - idx,
      };
      return [
        { ...line, data: toData(env.max) },
        { ...line, data: toData(env.min) },
      ];
    });

    const xAxes = visibleTraces.length > 0
      ? visibleTraces.map((t, idx) => {
          const d = traceDisplays.get(t.trace)!;
          return {
            type: "value" as const,
            min: d.axisMin,
            max: d.axisMax,
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
          };
        })
      : [{ type: "value" as const, show: false, min: 0, max: 1 }];

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
        splitNumber: tickCount,
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
      },
      dataZoom: [{ type: "inside", yAxisIndex: 0, filterMode: "none", zoomOnMouseWheel: true, moveOnMouseMove: false }],
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
            fontSize: 8 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            padding: [3, 6],
            formatter: mode === "depth"
              ? (params: { value: number | string | Date }) => {
                  const d = formatDepth(Number(params.value), settings.unitSystem);
                  return `${d.value} ${d.unit}`;
                }
              : (params: { value: number | string | Date }) => {
                  const min = ((Number(params.value) % 1440) + 1440) % 1440;
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
        textStyle: { color: c.fg, fontSize: 10 * fsScale, fontFamily: "Share Tech Mono, monospace" },
        formatter: (params: unknown) => {
          const ps = params as Array<{ seriesName: string; value: [number, number] }>;
          if (!ps?.length) return "";
          // Two series share each trace's name (min + max line) — collapse
          // them into one min–max band readout per trace.
          const band = new Map<string, { lo: number; hi: number }>();
          for (const p of ps) {
            const v = p.value[0];
            const e = band.get(p.seriesName);
            if (e) {
              e.lo = Math.min(e.lo, v);
              e.hi = Math.max(e.hi, v);
            } else {
              band.set(p.seriesName, { lo: v, hi: v });
            }
          }
          return [...band.entries()]
            .flatMap(([trace, mm]) => {
              const d = traceDisplays.get(trace);
              if (!d) return [];
              const color = tcL[trace as keyof typeof tcL] || c.fgMuted;
              const val =
                mm.lo === mm.hi
                  ? mm.lo.toFixed(1)
                  : `${mm.lo.toFixed(1)}–${mm.hi.toFixed(1)}`;
              return [`<span style="color:${color}">■</span> <span style="color:${c.fgMuted}">${d.name}</span> <span style="color:${c.fg};font-weight:600">${val}</span> <span style="color:${c.fgDim}">${d.unit}</span>`];
            })
            .join("<br/>");
        },
      },
      series,
    };
  }, [
    traces,
    traceVisibility,
    mode,
    rangePreset,
    logTrackRange,
    rulerRange,
    settings.unitSystem,
    fsScale,
    traceDisplays,
    stream,
  ]);

  useEffect(() => {
    if (!showLive) return;
    const ec = chartRef.current?.getEchartsInstance();
    if (!ec) return;

    ec.setOption(buildOption(), { lazyUpdate: true, replaceMerge: ["series"] });

    const flush = () => {
      pendingRaf.current = null;
      const inst = chartRef.current?.getEchartsInstance();
      if (!inst) return;
      inst.setOption(buildOption(), { lazyUpdate: true, replaceMerge: ["series"] });
    };

    const unsubscribe = globalRigStore.subscribe(
      (s) => (stream === "drill" ? s.drillRev : s.geoRev),
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
  }, [stream, buildOption, showLive]);

  const trackMeta = TRACKS_META.find((t) => t.id === trackId);
  const trackWidth = trackMeta ? (trackWidths[trackId] ?? trackMeta.defaultWidth) : 180;

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "border-r border-(--theme-border) last:border-r-0",
        "bg-(--theme-base) overflow-hidden",
        stream === "drill"
          ? "shadow-[inset_2px_0_0_var(--theme-ok)]"
          : "shadow-[inset_2px_0_0_var(--theme-info)]",
      )}
      style={{ width: trackWidth }}
    >
      <div className="px-2 h-10 flex items-center gap-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">{title}</span>
        <Badge intent="neutral" size="xs">{hz}</Badge>
      </div>

      <TrackHeader
        traces={traces}
        traceColors={tc}
        traceVisibility={traceVisibility}
        onToggle={(trace) => toggleTraceVisibility(trace)}
        compact={settings.density === "compact"}
        unitSystem={settings.unitSystem}
      />

      <div className="relative flex-1 overflow-hidden">
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
            onEvents={{ datazoom: handleDataZoom }}
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
