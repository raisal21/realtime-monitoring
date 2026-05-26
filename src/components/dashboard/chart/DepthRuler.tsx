import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE } from "@/store/app-store";
import { useLiveSessionRange } from "@/hooks/dashboard-hooks";
import { getChartColors } from "@/lib/echarts-theme";
import { formatDepth } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  getViewport,
  type ViewportSession,
} from "@/lib/chart-viewport";
import { getTickCount } from "@/lib/chart-ticks";
import {
  projectDepthAtTime,
  tileDepthPoints,
  type TileDepthPoint,
} from "@/services/tiles-client";
import { isTilePreset } from "@/lib/tile-resolution";

export function DepthRuler({ isPrimary }: { isPrimary: boolean }) {
  const chart = useStore(globalRigStore, (s) => s.chart);
  const drillTiles = useStore(globalRigStore, (s) => s.chart.drillTiles);
  const geoTiles = useStore(globalRigStore, (s) => s.chart.geoTiles);
  const setLogTrackRange = useStore(
    globalRigStore,
    (s) => s.setLogTrackRange,
  );
  const setCrosshairValue = useStore(
    globalRigStore,
    (s) => s.setCrosshairValue,
  );
  const { state: settings } = useSettings();
  const echartsRef = useRef<ReactECharts>(null);
  const axisPointerActive = useRef(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [canvasH, setCanvasH] = useState(600);
  useEffect(() => {
    const node = chartContainerRef.current;
    if (!node) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setCanvasH(e.contentRect.height);
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const {
    depthMin: sessionMin,
    depthMax: sessionMax,
    timeMin,
    timeMax,
    cursorDepth,
    ropMPerMin,
  } = useLiveSessionRange();
  const wideTilePreset = isTilePreset(chart.rangePreset);
  const depthSession: ViewportSession = {
    min: sessionMin,
    max: sessionMax,
    cursor: cursorDepth,
    ropMPerMin,
  };
  const timeSession: ViewportSession = {
    min: timeMin,
    max: timeMax,
    cursor: timeMax,
  };
  const yRange = getViewport(
    chart,
    chart.mode === "time" ? timeSession : depthSession,
    chart.mode === "time" ? true : isPrimary,
    chart.mode === "time" ? "time" : "depth",
  );

  const tileDepth = useMemo<TileDepthPoint[]>(() => {
    const drill = drillTiles ? tileDepthPoints(drillTiles) : [];
    if (drill.length > 0) return drill;
    return geoTiles ? tileDepthPoints(geoTiles) : [];
  }, [drillTiles, geoTiles]);

  const projectLiveDepthAtTime = useCallback((timestamp: number): number | null => {
    if (!Number.isFinite(timestamp)) return null;
    const ring = globalRigStore.getState().drillRing;
    const n = ring.size;
    if (n === 0) return null;

    const firstTime = ring.field("timestamp", 0);
    const lastTime = ring.field("timestamp", n - 1);
    if (timestamp <= firstTime) return ring.field("depth", 0);
    if (timestamp >= lastTime) return ring.field("depth", n - 1);

    let lo = 0;
    let hi = n - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const t = ring.field("timestamp", mid);
      if (t === timestamp) return ring.field("depth", mid);
      if (t < timestamp) lo = mid + 1;
      else hi = mid - 1;
    }

    const prevTime = ring.field("timestamp", hi);
    const nextTime = ring.field("timestamp", lo);
    const prevDepth = ring.field("depth", hi);
    const nextDepth = ring.field("depth", lo);
    if (nextTime === prevTime) return nextDepth;
    const t = (timestamp - prevTime) / (nextTime - prevTime);
    return prevDepth + (nextDepth - prevDepth) * t;
  }, []);

  const depthAtAxisValue = useCallback((value: number): number | null => {
    if (chart.mode !== "time") return value;
    if (wideTilePreset) return projectDepthAtTime(tileDepth, value);
    if (chart.tileStatus === "ready" && chart.tileRange !== null) {
      return projectDepthAtTime(tileDepth, value);
    }
    return projectDepthAtTime(tileDepth, value) ?? projectLiveDepthAtTime(value);
  }, [chart.mode, chart.tileRange, chart.tileStatus, projectLiveDepthAtTime, tileDepth, wideTilePreset]);

  const formatDepthAtAxisValue = useCallback((value: number): string => {
    const depth = depthAtAxisValue(value);
    if (depth == null) return "--";
    return formatDepth(depth, settings.unitSystem).value;
  }, [depthAtAxisValue, settings.unitSystem]);

  // Tick count adapts to canvas height via getTickCount helper. Tick values
  // won't land on round numbers but density stays readable across resizes.
  // axisLabel formatter rounds for readability. Crosshair projection uses
  // raw bounds so the tooltip pixel matches the cursor exactly.
  const tickCount = getTickCount(canvasH);
  const span = yRange.max - yRange.min;
  const tickInterval = span > 0 ? span / tickCount : 1;
  const axisMin = yRange.min;
  const axisMax = yRange.max;

  useEffect(() => {
    const ec = echartsRef.current?.getEchartsInstance();
    if (!ec) return;

    const { crosshairValue } = chart;

    if (crosshairValue !== null) {
      const depthValue =
        axisMin + crosshairValue * (axisMax - axisMin);
      const coords = ec.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
        0.5,
        depthValue,
      ]);
      if (coords) {
        ec.dispatchAction({
          type: "showTip",
          x: ec.getWidth() / 2,
          y: (coords as number[])[1],
        });
      }
      if (!axisPointerActive.current) {
        ec.setOption({
          yAxis: [
            {
              axisPointer: { label: { show: true }, crossStyle: { width: 1 } },
            },
            {},
          ],
        });
        axisPointerActive.current = true;
      }
    } else if (axisPointerActive.current) {
      ec.dispatchAction({ type: "hideTip" });
      ec.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
      ec.getZr().trigger("globalout", {});
      ec.setOption({
        yAxis: [
          { axisPointer: { label: { show: false }, crossStyle: { width: 0 } } },
          {},
        ],
      });
      axisPointerActive.current = false;
    }
  }, [chart.crosshairValue, axisMin, axisMax]);

  const sliderAxisMin =
    chart.mode === "depth" && chart.tileDepthRange
      ? chart.tileDepthRange.min
      : sessionMin;
  const sliderAxisMax =
    chart.mode === "depth" && chart.tileDepthRange
      ? chart.tileDepthRange.max
      : sessionMax;
  const handleDataZoom = useCallback(
    (params: unknown) => {
      // Non-primary ruler shows a projected window in the wrong unit for
      // logTrackRange (which is in chart.mode units), so its dataZoom must
      // not drive the log track scope.
      if (!isPrimary) return;
      type DZ = {
        start?: number; end?: number;
        startValue?: number; endValue?: number;
      };
      const p = params as DZ & { batch?: DZ[] };
      const raw: DZ = p.batch?.[0] ?? p;
      let lo: number, hi: number;
      if (raw.startValue !== undefined && raw.endValue !== undefined) {
        lo = Math.min(raw.startValue, raw.endValue);
        hi = Math.max(raw.startValue, raw.endValue);
      } else if (raw.start !== undefined && raw.end !== undefined) {
        // Slider on a value axis without series sometimes emits only percentages.
        const span = sliderAxisMax - sliderAxisMin;
        lo = sliderAxisMin + (Math.min(raw.start, raw.end) / 100) * span;
        hi = sliderAxisMin + (Math.max(raw.start, raw.end) / 100) * span;
      } else {
        return;
      }
      setLogTrackRange(lo, hi);
    },
    [setLogTrackRange, sliderAxisMin, sliderAxisMax, isPrimary],
  );

  const handleMouseMove = isPrimary
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(
          0,
          Math.min(1, (e.clientY - rect.top) / rect.height),
        );
        setCrosshairValue(pct);
      }
    : undefined;

  const handleMouseLeave = isPrimary
    ? () => {
        setCrosshairValue(null);
      }
    : undefined;

  const showDataZoomSlider =
    isPrimary && chart.mode === "depth" && chart.rulerSlider && !chart.liveMode;

  const fsScale = FS_SCALE[settings.fontSize];

  // Slider operates on the full axis range (so its handles always represent
  // the current zoom *within the active axis*); start/end percentages reflect
  // the current visible window.
  const sessionSpan = sliderAxisMax - sliderAxisMin || 1;
  const sliderStartPct = ((yRange.min - sliderAxisMin) / sessionSpan) * 100;
  const sliderEndPct = ((yRange.max - sliderAxisMin) / sessionSpan) * 100;

  const pendingRaf = useRef<number | null>(null);

  const buildOption = useCallback((): EChartsOption => {
    const c = getChartColors();
    const tickColor = isPrimary ? c.accent : c.fgDim;
    const labelColor = isPrimary ? c.fgMuted : c.fgDim;

    return {
      animation: false,
      backgroundColor: c.base,
      grid: { top: 0, bottom: 0, left: 0, right: 4, containLabel: false },
      tooltip: {
        trigger: "axis",
        triggerOn: "none",
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
          min: axisMin,
          max: axisMax,
          inverse: true,
          position: "left",
          interval: tickInterval,
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
            fontSize: 9 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            color: labelColor,
            hideOverlap: true,
            formatter: (val: number) => formatDepthAtAxisValue(val),
          },
          splitLine: { show: false },
          axisPointer: {
            label: {
              show: true,
              backgroundColor: c.accent,
              color: c.fg,
              borderWidth: 0,
              fontSize: 11 * fsScale,
              fontFamily: "Share Tech Mono, monospace",
              padding: [3, 6],
              formatter: (params: { value: number | string | Date }) => {
                return formatDepthAtAxisValue(Number(params.value));
              },
            },
          },
        },
        // Hidden axis for the slider — spans the FULL session range so the
        // slider's handles always show the current zoom *within the session*,
        // independently of the displayed axis (which follows current zoom).
        {
          type: "value",
          min: sliderAxisMin,
          max: sliderAxisMax,
          inverse: true,
          show: false,
        },
      ],
      dataZoom: !isPrimary
        ? []
        : showDataZoomSlider
          ? [
              {
                type: "inside",
                yAxisIndex: 1,
                filterMode: "none",
                zoomOnMouseWheel: true,
                moveOnMouseMove: false,
                moveOnMouseWheel: true,
                start: sliderStartPct,
                end: sliderEndPct,
              },
              {
                type: "slider",
                yAxisIndex: 1,
                orient: "vertical",
                left: 0,
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
                start: sliderStartPct,
                end: sliderEndPct,
              },
            ]
          : [
              {
                type: "inside",
                yAxisIndex: 1,
                filterMode: "none",
                zoomOnMouseWheel: true,
                moveOnMouseMove: false,
                moveOnMouseWheel: true,
              },
            ],
      // Invisible anchor series so dataZoom on yAxisIndex 1 has data to bind
      // to; without this the slider may render but not emit zoom events.
      series: [
        {
          type: "line" as const,
          xAxisIndex: 0,
          yAxisIndex: 1,
          data: [
            [0.5, sliderAxisMin],
            [0.5, sliderAxisMax],
          ],
          showSymbol: false,
          lineStyle: { opacity: 0 },
          silent: true,
          tooltip: { show: false },
        },
      ],
    };
  }, [
    fsScale,
    isPrimary,
    axisMin,
    axisMax,
    sliderAxisMin,
    sliderAxisMax,
    sliderStartPct,
    sliderEndPct,
    showDataZoomSlider,
    tickInterval,
    formatDepthAtAxisValue,
  ]);

  // Imperative apply: prop-driven re-render with notMerge would blow away the
  // axisPointer state the crosshair effect installs via setOption merge. So we
  // mount the chart with option={{}} and apply buildOption() here in merge
  // mode. replaceMerge: ["dataZoom"] handles the array-shape transition
  // between live (1 item) and slider-zoom (2 items) cases.
  useEffect(() => {
    const ec = echartsRef.current?.getEchartsInstance();
    if (!ec) return;
    ec.setOption(buildOption(), { lazyUpdate: true, replaceMerge: ["dataZoom"] });

    const flush = () => {
      pendingRaf.current = null;
      const inst = echartsRef.current?.getEchartsInstance();
      if (!inst) return;
      inst.setOption(buildOption(), { lazyUpdate: true, replaceMerge: ["dataZoom"] });
    };

    const unsubscribe = globalRigStore.subscribe(
      (s) => s.drillRev,
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
  }, [buildOption]);

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
        <div className="label-mono mt-0.5">{formatDepth(0, settings.unitSystem).unit} MD</div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col">
        <div className="flex items-center pt-2 pb-1">
          <div
            className={cn(
              "w-1.5 h-px flex-shrink-0",
              isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)",
            )}
          />
          <span
            className={cn(
              "font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums ml-1",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            {formatDepthAtAxisValue(yRange.min)}
          </span>
        </div>
        <div className="flex flex-1">
          <div
            className={cn(
              "w-px ml-[3px]",
              isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-border)",
            )}
            style={{ opacity: 0.35 }}
          />
        </div>
        <div className="flex items-center pt-1 pb-2">
          <div
            className={cn(
              "w-1.5 h-px flex-shrink-0",
              isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)",
            )}
          />
          <span
            className={cn(
              "font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums ml-1",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            {formatDepthAtAxisValue(yRange.max)}
          </span>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="relative flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactECharts
          ref={echartsRef}
          echarts={echarts}
          option={{}}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge={false}
          lazyUpdate
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>
    </div>
  );
}
