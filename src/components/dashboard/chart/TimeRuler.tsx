import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE } from "@/store/app-store";
import { useLiveSessionRange } from "@/hooks/dashboard-hooks";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";
import {
  getViewport,
  type ViewportSession,
} from "@/lib/chart-viewport";
import { getTickCount } from "@/lib/chart-ticks";
import { formatLocalHHMM } from "@/lib/time-format";
import {
  projectTimeAtDepth,
  tileDepthPoints,
  type TileDepthPoint,
} from "@/services/tiles-client";
import { isTilePreset } from "@/lib/tile-resolution";

const MS_PER_MIN = 60_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TimeRuler({ isPrimary }: { isPrimary: boolean }) {
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
    depthMin,
    depthMax,
    timeMin: sessionMin,
    timeMax: sessionMax,
    cursorDepth,
    ropMPerMin,
  } = useLiveSessionRange();
  const timeSession: ViewportSession = {
    min: sessionMin,
    max: sessionMax,
    cursor: sessionMax,
  };
  const depthSession: ViewportSession = {
    min: depthMin,
    max: depthMax,
    cursor: cursorDepth,
    ropMPerMin,
  };
  const yRange = getViewport(
    chart,
    chart.mode === "depth" ? depthSession : timeSession,
    chart.mode === "depth" ? true : isPrimary,
    chart.mode === "depth" ? "depth" : "time",
  );
  const wideTilePreset = isTilePreset(chart.rangePreset);

  const tileDepth = useMemo<TileDepthPoint[]>(() => {
    const drill = drillTiles ? tileDepthPoints(drillTiles) : [];
    if (drill.length > 0) return drill;
    return geoTiles ? tileDepthPoints(geoTiles) : [];
  }, [drillTiles, geoTiles]);

  const projectLiveTimeAtDepth = useCallback((depth: number): number | null => {
    if (!Number.isFinite(depth)) return null;
    const ring = globalRigStore.getState().drillRing;
    const points: TileDepthPoint[] = [];
    for (let i = 0; i < ring.size; i++) {
      points.push({
        timestamp: ring.field("timestamp", i),
        depth: ring.field("depth", i),
      });
    }
    return projectTimeAtDepth(points, depth);
  }, []);

  const timeAtAxisValue = useCallback((value: number): number | null => {
    if (chart.mode !== "depth") return value;
    if (wideTilePreset) return projectTimeAtDepth(tileDepth, value);
    return projectTimeAtDepth(tileDepth, value) ?? projectLiveTimeAtDepth(value);
  }, [chart.mode, projectLiveTimeAtDepth, tileDepth, wideTilePreset]);

  const formatTimeAtAxisValue = useCallback((value: number): string => {
    const timestamp = timeAtAxisValue(value);
    return timestamp == null ? "--:--" : formatLocalHHMM(timestamp);
  }, [timeAtAxisValue]);

  // Tick count adapts to canvas height via getTickCount helper. Values
  // won't land on round wall-clock minutes but density stays readable across
  // resizes. formatLocalHHMM formatter rounds to nearest minute. Crosshair
  // projection uses raw bounds so the tooltip pixel matches the cursor.
  const tickCount = getTickCount(canvasH);
  const spanMs = yRange.max - yRange.min;
  const tickIntervalMs = spanMs > 0 ? spanMs / tickCount : MS_PER_MIN;
  const axisMin = yRange.min;
  const axisMax = yRange.max;

  useEffect(() => {
    const ec = echartsRef.current?.getEchartsInstance();
    if (!ec) return;

    const { crosshairValue } = chart;

    if (crosshairValue !== null) {
      const timeValue = axisMin + crosshairValue * (axisMax - axisMin);
      const coords = ec.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
        0.5,
        timeValue,
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
    chart.mode === "depth"
      ? (chart.tileDepthRange?.min ?? depthMin)
      : (chart.tileRange?.min ?? sessionMin);
  const sliderAxisMax =
    chart.mode === "depth"
      ? (chart.tileDepthRange?.max ?? depthMax)
      : (chart.tileRange?.max ?? sessionMax);
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
    isPrimary && chart.mode === "time" && chart.rulerSlider && !chart.liveMode;

  const fsScale = FS_SCALE[settings.fontSize];

  // Slider operates on full axis range; start/end percentages reflect the
  // current visible window position within the active time/depth axis.
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
          interval: tickIntervalMs,
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
            formatter: (val: number) => formatTimeAtAxisValue(val),
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
              formatter: (params: { value: number | string | Date }) =>
                formatTimeAtAxisValue(Number(params.value)),
            },
          },
        },
        // Hidden axis for the slider — spans the FULL session range so the
        // slider's handles always represent the current zoom *within* the
        // session (the displayed axis above follows the zoomed range).
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
                width: 42,
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
    tickIntervalMs,
    formatTimeAtAxisValue,
  ]);

  const topTimestamp = timeAtAxisValue(yRange.min);
  const bottomTimestamp = timeAtAxisValue(yRange.max);
  const topDate = topTimestamp == null ? null : new Date(topTimestamp);
  const bottomDate = bottomTimestamp == null ? null : new Date(bottomTimestamp);

  // See DepthRuler for the why: prop-driven notMerge re-renders blow away
  // the axisPointer state installed by the crosshair effect, causing tooltip
  // flicker. Apply imperatively in merge mode instead.
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
        <div className="label-mono mt-0.5">LOCAL</div>
      </div>

      <div className="h-[72px] flex-shrink-0 border-b border-(--theme-border) flex flex-col">
        <div className="flex items-center pt-2 pb-1">
          <div
            className={cn(
              "w-1.5 h-px flex-shrink-0",
              isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)",
            )}
          />
          <div
            className={cn(
              "flex flex-col items-start ml-1 leading-none gap-px",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            <span className="font-['Barlow_Condensed',sans-serif] text-fs-7 uppercase tracking-wider opacity-75">
              {topDate ? `${MONTHS[topDate.getMonth()]} ${topDate.getDate()}` : "--"}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums">
              {formatTimeAtAxisValue(yRange.min)}
            </span>
          </div>
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
          <div
            className={cn(
              "flex flex-col items-start ml-1 leading-none gap-px",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            <span className="font-['Barlow_Condensed',sans-serif] text-fs-7 uppercase tracking-wider opacity-75">
              {bottomDate ? `${MONTHS[bottomDate.getMonth()]} ${bottomDate.getDate()}` : "--"}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums">
              {formatTimeAtAxisValue(yRange.max)}
            </span>
          </div>
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
