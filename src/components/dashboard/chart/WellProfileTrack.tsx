import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { WELL_PROFILE_MAX_DEPTH_M } from "@/data/dashboard-static";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE } from "@/store/app-store";
import { useLiveSessionRange } from "@/hooks/dashboard-hooks";
import { formatDepth } from "@/lib/units";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";
import { LIVE_WELL_ID } from "@/data/wells";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import {
  clampRangeToBounds,
  resolveWellProfileActiveBounds,
  shouldShowWellProfileSlider,
} from "@/lib/well-profile-slider";
import {
  capRangeToLatest,
  historyExtentTimeRange,
  type NumericRange,
} from "@/lib/history-extent";
import {
  normalizeProfileTimeRange,
  profileDepthAxisRange,
  wellProfilePointsFromTiles,
  wellProfileTimeRangeFromPoints,
} from "@/lib/well-profile-history";

type DataZoomPayload = {
  start?: number;
  end?: number;
  startValue?: number;
  endValue?: number;
};

function asFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveZoomRange(
  params: unknown,
  bounds: NumericRange,
): NumericRange | null {
  const payload = params as DataZoomPayload & { batch?: DataZoomPayload[] };
  const raw = payload.batch?.[0] ?? payload;
  const startValue = asFiniteNumber(raw.startValue);
  const endValue = asFiniteNumber(raw.endValue);
  if (startValue != null && endValue != null) {
    return clampRangeToBounds(startValue, endValue, bounds);
  }

  const start = asFiniteNumber(raw.start);
  const end = asFiniteNumber(raw.end);
  if (start == null || end == null) return null;
  const span = bounds.max - bounds.min;
  const a = bounds.min + (Math.min(start, end) / 100) * span;
  const b = bounds.min + (Math.max(start, end) / 100) * span;
  return clampRangeToBounds(a, b, bounds);
}

function clampToProfileRange(
  range: NumericRange | null | undefined,
  bounds: NumericRange,
): NumericRange {
  if (!range) return bounds;
  return clampRangeToBounds(range.min, range.max, bounds) ?? bounds;
}

function formatProfileTime(value: number): string {
  if (!Number.isFinite(value)) return "--";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center px-2 text-center">
      <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-dim) uppercase tracking-[0.1em]">
        {label}
      </span>
    </div>
  );
}

export function WellProfileTrack() {
  const mode = useStore(globalRigStore, (s) => s.chart.mode);
  const rangePreset = useStore(globalRigStore, (s) => s.chart.rangePreset);
  const liveMode = useStore(globalRigStore, (s) => s.chart.liveMode);
  const rulerRange = useStore(globalRigStore, (s) => s.chart.rulerRange);
  const tileRange = useStore(globalRigStore, (s) => s.chart.tileRange);
  const tileDepthRange = useStore(
    globalRigStore,
    (s) => s.chart.tileDepthRange,
  );
  const historyExtentStatus = useStore(
    globalRigStore,
    (s) => s.chart.historyExtentStatus,
  );
  const historyExtent = useStore(globalRigStore, (s) => s.chart.historyExtent);
  const wellProfileHistoryStatus = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryStatus,
  );
  const wellProfileHistoryError = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryError,
  );
  const wellProfileHistoryTiles = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryTiles,
  );
  const wellProfileHistoryRange = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileHistoryRange,
  );
  const wellProfileSlider = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileSlider,
  );
  const setRulerRange = useStore(globalRigStore, (s) => s.setRulerRange);
  const status = useStore(globalRigStore, (s) => s.status);
  const { well } = useCurrentWell();
  const isLive = well?.id === LIVE_WELL_ID;
  const showLive = isLive && status === "ONLINE";
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];
  const {
    depthMin: sessionDepthMin,
    depthMax: sessionDepthMax,
    timeMin: sessionTimeMin,
    timeMax: sessionTimeMax,
    cursorDepth,
  } = useLiveSessionRange();

  const chartRef = useRef<ReactECharts>(null);
  const pendingRaf = useRef<number | null>(null);
  const manualTimeBounds = useMemo(
    () => capRangeToLatest(historyExtentTimeRange(historyExtent)),
    [historyExtent],
  );
  const activeBounds = useMemo(
    () =>
      resolveWellProfileActiveBounds({
        mode,
        rangePreset,
        tileRange,
        tileDepthRange,
        manualTimeBounds,
        sessionDepthMin,
        sessionDepthMax,
        sessionTimeMin,
        sessionTimeMax,
      }),
    [
      mode,
      rangePreset,
      tileRange,
      tileDepthRange,
      manualTimeBounds,
      sessionDepthMin,
      sessionDepthMax,
      sessionTimeMin,
      sessionTimeMax,
    ],
  );
  const profilePoints = useMemo(
    () => wellProfilePointsFromTiles(wellProfileHistoryTiles),
    [wellProfileHistoryTiles],
  );
  const profileTimeRange = useMemo(
    () =>
      normalizeProfileTimeRange(
        wellProfileTimeRangeFromPoints(profilePoints) ?? wellProfileHistoryRange,
      ),
    [profilePoints, wellProfileHistoryRange],
  );
  const depthAxisRange = useMemo(
    () => profileDepthAxisRange(profilePoints, WELL_PROFILE_MAX_DEPTH_M),
    [profilePoints],
  );
  const showSlider = shouldShowWellProfileSlider(
    mode,
    wellProfileSlider,
    liveMode,
  );
  const sliderRange = useMemo(
    () =>
      profileTimeRange
        ? clampToProfileRange(rulerRange ?? activeBounds, profileTimeRange)
        : activeBounds,
    [activeBounds, profileTimeRange, rulerRange],
  );

  const handleDataZoom = useCallback(
    (params: unknown) => {
      if (!showSlider || !profileTimeRange) return;
      const next = resolveZoomRange(params, profileTimeRange);
      if (!next) return;
      setRulerRange(next.min, next.max);
    },
    [profileTimeRange, setRulerRange, showSlider],
  );

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const latest = globalRigStore.getState().drillRing.latest();
    const currentDepthM = showLive && latest ? latest.depth : cursorDepth;
    const yRange = profileTimeRange ?? {
      min: sessionTimeMin,
      max: sessionTimeMax,
    };
    const data = profilePoints.map((point) => [point.depth, point.timestamp]);

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
        padding: [5, 8],
        textStyle: {
          color: c.fg,
          fontSize: 10 * fsScale,
          fontFamily: "Share Tech Mono, monospace",
        },
        appendToBody: true,
        extraCssText: "z-index: 20",
        formatter: (params: unknown) => {
          const ps = params as Array<{ axisValue: number; value: number[] }>;
          const first = ps?.[0];
          if (!first) return "";
          const depth = Number(first.value?.[0]);
          const timestamp = Number(first.value?.[1] ?? first.axisValue);
          const d = formatDepth(depth, settings.unitSystem);
          return `<span style="color:${c.fgMuted}">${formatProfileTime(
            timestamp,
          )}</span>&nbsp;&nbsp;<span style="color:${c.accent};font-weight:600">${d.value} ${d.unit}</span>`;
        },
      },
      xAxis: {
        type: "value",
        min: depthAxisRange.min,
        max: depthAxisRange.max,
        inverse: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        axisPointer: {
          show: true,
          label: {
            show: true,
            backgroundColor: c.accent,
            color: c.fg,
            borderWidth: 0,
            fontSize: 8 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            padding: [3, 6],
            formatter: (params: { value: number | string | Date }) => {
              const d = formatDepth(Number(params.value), settings.unitSystem);
              return `${d.value} ${d.unit}`;
            },
          },
        },
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
      },
      yAxis: {
        type: "value",
        min: yRange.min,
        max: yRange.max,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: c.borderSubtle, width: 0.5, type: "dashed" },
        },
        axisPointer: {
          show: true,
          label: {
            show: true,
            backgroundColor: c.accent,
            color: c.fg,
            borderWidth: 0,
            fontSize: 8 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            padding: [3, 6],
            formatter: (params: { value: number | string | Date }) =>
              formatProfileTime(Number(params.value)),
          },
        },
      },
      series: [
        {
          type: "line",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data,
          symbol: "none",
          lineStyle: { color: c.accent, width: 1.5, opacity: 0.95 },
          endLabel: {
            show: true,
            formatter: formatDepth(currentDepthM, settings.unitSystem).value,
            color: c.accent,
            fontSize: 8 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            backgroundColor: c.surface,
            padding: [1, 3],
          },
        },
      ],
      dataZoom:
        showSlider && profileTimeRange
          ? [
              {
                type: "inside" as const,
                yAxisIndex: 0,
                filterMode: "none" as const,
                zoomOnMouseWheel: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: true,
                startValue: sliderRange.min,
                endValue: sliderRange.max,
              },
              {
                type: "slider" as const,
                yAxisIndex: 0,
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
                startValue: sliderRange.min,
                endValue: sliderRange.max,
              },
            ]
          : [
              {
                type: "inside" as const,
                yAxisIndex: 0,
                filterMode: "none" as const,
                zoomOnMouseWheel: false,
                moveOnMouseMove: false,
                moveOnMouseWheel: false,
              },
            ],
    };
  }, [
    cursorDepth,
    depthAxisRange.max,
    depthAxisRange.min,
    fsScale,
    profilePoints,
    profileTimeRange,
    sessionTimeMax,
    sessionTimeMin,
    settings.unitSystem,
    showLive,
    showSlider,
    sliderRange.max,
    sliderRange.min,
  ]);

  useEffect(() => {
    if (!showLive) return;

    const flush = () => {
      pendingRaf.current = null;
      const inst = chartRef.current?.getEchartsInstance();
      if (!inst) return;
      const latest = globalRigStore.getState().drillRing.latest();
      if (!latest) return;
      const formatted = formatDepth(latest.depth, settings.unitSystem).value;
      inst.setOption(
        {
          series: [
            {
              endLabel: { formatter: formatted },
            },
          ],
        },
        { lazyUpdate: true },
      );
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
  }, [showLive, settings.unitSystem]);

  const hasProfile = profilePoints.length > 0 && profileTimeRange !== null;
  const loadingProfile =
    historyExtentStatus === "idle" ||
    historyExtentStatus === "loading" ||
    wellProfileHistoryStatus === "idle" ||
    wellProfileHistoryStatus === "loading";
  const profilePlaceholder =
    wellProfileHistoryStatus === "error"
      ? (wellProfileHistoryError ?? "Profile unavailable")
      : loadingProfile
        ? "Loading profile"
        : "No profile history";

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
          <span className="label-mono">time x depth</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {!isLive ? (
          <Placeholder label="No live feed for this well" />
        ) : status !== "ONLINE" ? (
          <Placeholder label="Connecting..." />
        ) : !hasProfile ? (
          <Placeholder label={profilePlaceholder} />
        ) : (
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            style={{ width: "100%", height: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge
            onEvents={{ datazoom: handleDataZoom }}
          />
        )}
      </div>

      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-muted) tabular">
          {(() => {
            const d = formatDepth(WELL_PROFILE_MAX_DEPTH_M, settings.unitSystem);
            return `${d.value} ${d.unit}`;
          })()}
        </span>
      </div>
    </div>
  );
}
