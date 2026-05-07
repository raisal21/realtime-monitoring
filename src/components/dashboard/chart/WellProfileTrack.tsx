import { useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  WELL_SESSION,
  WELL_PROFILE_DATA,
  parseWellProfileDate,
  dateToSessionMinute,
} from "@/data/dashboard-static";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useSettings, FS_SCALE } from "@/stores/app-store";
import { formatDepth } from "@/lib/units";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

// Pre-resolve session-minute for each WP_DATA entry — used by the inverse
// lookup below; avoids re-parsing date strings on every drag tick.
const WP_LAST_IDX = WELL_PROFILE_DATA.length - 1;
const WP_DEPTHS = WELL_PROFILE_DATA.map((d) => d.depth);
const WP_SESSION_MIN = WELL_PROFILE_DATA.map((d) =>
  dateToSessionMinute(parseWellProfileDate(d.date)),
);

// Linear interpolation between successive WP entries. The slider position is
// a fractional index in [0, WP_LAST_IDX], so depth/time at that position is a
// continuous quantity — gives smooth handle motion instead of snapping to one
// of 14 discrete entries.
function lerpAtIdx(values: readonly number[], idx: number): number {
  if (idx <= 0) return values[0];
  if (idx >= WP_LAST_IDX) return values[WP_LAST_IDX];
  const lo = Math.floor(idx);
  const t = idx - lo;
  return values[lo] * (1 - t) + values[lo + 1] * t;
}

// Inverse of lerpAtIdx for monotonically-increasing series (both depth and
// session-minute over WP entries are monotonic). Returns fractional WP index
// matching `value`.
function idxAt(values: readonly number[], value: number): number {
  if (value <= values[0]) return 0;
  if (value >= values[WP_LAST_IDX]) return WP_LAST_IDX;
  for (let i = 0; i < WP_LAST_IDX; i++) {
    const a = values[i];
    const b = values[i + 1];
    if (value >= a && value <= b) {
      return b === a ? i : i + (value - a) / (b - a);
    }
  }
  return WP_LAST_IDX;
}

export function WellProfileTrack() {
  // Per-field selectors: avoid re-render on unrelated chart mutations
  // (crosshair, traceVisibility, log-track range, track layout).
  const mode = useStore(globalRigStore, (s) => s.chart.mode);
  const liveMode = useStore(globalRigStore, (s) => s.chart.liveMode);
  const rulerRange = useStore(globalRigStore, (s) => s.chart.rulerRange);
  const wellProfileSlider = useStore(
    globalRigStore,
    (s) => s.chart.wellProfileSlider,
  );
  const setRulerRange = useStore(globalRigStore, (s) => s.setRulerRange);
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];

  // Well-profile y-axis is a category axis of dates, so dataZoom emits
  // start/end as category indices. Map indices → wall-clock date via
  // WELL_PROFILE_DATA, then translate to the current chart mode's units
  // and write to the Ruler scope (well-profile slider drives Time/Depth Ruler).
  // Well profile spans Mar 12 → Apr 28; session covers only the last 7 days
  // (Apr 22 → Apr 29 / 13900..15200 ft), so clamp dispatched values to the
  // session window — pre-session entries have no log data to display.
  const handleDataZoom = useCallback(
    (params: unknown) => {
      type DZ = {
        start?: number; end?: number;
        startValue?: number; endValue?: number;
      };
      const p = params as DZ & { batch?: DZ[] };
      const raw: DZ = p.batch?.[0] ?? p;

      // Resolve to fractional indices over WELL_PROFILE_DATA — slider may emit
      // numeric `startValue`/`endValue` OR percentage `start`/`end` (the latter
      // happens when the dataZoom is configured with controlled start/end).
      let loIdx: number, hiIdx: number;
      if (raw.startValue !== undefined && raw.endValue !== undefined) {
        loIdx = Math.min(raw.startValue, raw.endValue);
        hiIdx = Math.max(raw.startValue, raw.endValue);
      } else if (raw.start !== undefined && raw.end !== undefined) {
        loIdx = (Math.min(raw.start, raw.end) / 100) * WP_LAST_IDX;
        hiIdx = (Math.max(raw.start, raw.end) / 100) * WP_LAST_IDX;
      } else {
        return;
      }
      loIdx = Math.max(0, Math.min(WP_LAST_IDX, loIdx));
      hiIdx = Math.max(0, Math.min(WP_LAST_IDX, hiIdx));

      // Interpolate continuous depth/time at the fractional index, then clamp
      // to the session window — pre-session entries have no log data.
      if (mode === "depth") {
        const { min: dMin, max: dMax } = WELL_SESSION.depthAxis.range;
        const a = lerpAtIdx(WP_DEPTHS, loIdx);
        const b = lerpAtIdx(WP_DEPTHS, hiIdx);
        const lo = Math.max(dMin, Math.min(dMax, Math.min(a, b)));
        const hi = Math.max(dMin, Math.min(dMax, Math.max(a, b)));
        if (hi <= lo) return; // empty overlap with session — keep current range
        setRulerRange(lo, hi);
      } else {
        const { min: tMin, max: tMax } = WELL_SESSION.timeAxis.range;
        const a = lerpAtIdx(WP_SESSION_MIN, loIdx);
        const b = lerpAtIdx(WP_SESSION_MIN, hiIdx);
        const lo = Math.max(tMin, Math.min(tMax, Math.min(a, b)));
        const hi = Math.max(tMin, Math.min(tMax, Math.max(a, b)));
        if (hi <= lo) return;
        setRulerRange(lo, hi);
      }
    },
    [mode, setRulerRange],
  );

  // Map current rulerRange back to a fractional WP index so the slider handles
  // stay exactly where the user dragged to. Inverse-interpolation against the
  // monotonic depth/time series gives sub-entry precision (no snapping to the
  // nearest of 14 entries). Required because the option object is rebuilt on
  // each dispatch with `notMerge` and would otherwise reset start/end.
  const sliderRange = useMemo(() => {
    const r = rulerRange;
    if (!r) return { startPct: 0, endPct: 100 };
    const series = mode === "depth" ? WP_DEPTHS : WP_SESSION_MIN;
    const s = idxAt(series, r.min);
    const e = idxAt(series, r.max);
    return {
      startPct: (Math.min(s, e) / WP_LAST_IDX) * 100,
      endPct: (Math.max(s, e) / WP_LAST_IDX) * 100,
    };
  }, [rulerRange, mode]);

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const { data, maxDepthM } = WELL_SESSION.wellProfile;
    const { depthM: currentDepthM } = WELL_SESSION.cursor;

    const dates = data.map((d) => d.date) as string[];
    const depths = data.map((d) => d.depth);

    const opt: EChartsOption = {
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
          const ps = params as Array<{ axisValue: string; value: number }>;
          if (!ps?.[0]) return "";
          const { axisValue, value } = ps[0];
          const d = formatDepth(value, settings.unitSystem);
          return `<span style="color:${c.fgMuted}">${axisValue}</span>&nbsp;&nbsp;<span style="color:${c.accent};font-weight:600">${d.value} ${d.unit}</span>`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: maxDepthM,
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
      yAxis: [
        {
          type: "category",
          data: dates,
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
              formatter: (params: { value: number | string | Date }) => {
                const idx = dates.indexOf(String(params.value));
                return idx >= 0 ? dates[idx] : String(params.value);
              },
            },
          },
        },
        // Hidden value axis spanning the WP_DATA index range — the slider
        // operates on this so the visible category axis (yAxisIndex 0) keeps
        // showing the full well history. Needs a paired anchor series below
        // (otherwise the slider renders but emits no datazoom events).
        {
          type: "value",
          min: 0,
          max: dates.length - 1,
          inverse: true,
          show: false,
          axisPointer: { show: false },
        },
      ],
      series: [
        {
          type: "line",
          yAxisIndex: 0,
          xAxisIndex: 0,
          data: depths,
          step: "end" as const,
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
        // Invisible anchor series so dataZoom on yAxisIndex 1 has data to bind
        // to; without this the slider renders but never emits zoom events.
        {
          type: "line" as const,
          xAxisIndex: 0,
          yAxisIndex: 1,
          data: [
            [0, 0],
            [0, dates.length - 1],
          ],
          showSymbol: false,
          lineStyle: { opacity: 0 },
          silent: true,
          tooltip: { show: false },
        },
      ],
      dataZoom:
        wellProfileSlider && !liveMode
          ? [
              {
                type: "inside" as const,
                yAxisIndex: 1,
                filterMode: "none" as const,
                zoomOnMouseWheel: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: true,
                start: sliderRange.startPct,
                end: sliderRange.endPct,
              },
              {
                type: "slider" as const,
                yAxisIndex: 1,
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
                start: sliderRange.startPct,
                end: sliderRange.endPct,
              },
            ]
          : [
              {
                type: "inside" as const,
                yAxisIndex: 1,
                filterMode: "none" as const,
                zoomOnMouseWheel: false,
                moveOnMouseMove: true,
                moveOnMouseWheel: true,
              },
            ],
    };

    return opt;
  }, [settings.theme, wellProfileSlider, liveMode, rulerRange, sliderRange.startPct, sliderRange.endPct, fsScale]);

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
          <span className="label-mono">time × depth</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>

      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-8 text-(--theme-fg-muted) tabular">
          {(() => {
            const d = formatDepth(WELL_SESSION.wellProfile.maxDepthM, settings.unitSystem);
            return `${d.value} ${d.unit}`;
          })()}
        </span>
      </div>
    </div>
  );
}
