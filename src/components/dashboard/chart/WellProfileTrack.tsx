import { useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  WELL_SESSION,
  WELL_PROFILE_DATA,
  parseWellProfileDate,
  dateToSessionMinute,
} from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

export function WellProfileTrack() {
  const { state: chart, dispatch } = useChart();
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
      const lastIdx = WELL_PROFILE_DATA.length - 1;

      // Resolve to fractional indices over WELL_PROFILE_DATA — slider may emit
      // numeric `startValue`/`endValue` OR percentage `start`/`end` (the latter
      // happens when the dataZoom is configured with controlled start/end).
      let lo: number, hi: number;
      if (raw.startValue !== undefined && raw.endValue !== undefined) {
        lo = Math.min(raw.startValue, raw.endValue);
        hi = Math.max(raw.startValue, raw.endValue);
      } else if (raw.start !== undefined && raw.end !== undefined) {
        lo = (Math.min(raw.start, raw.end) / 100) * lastIdx;
        hi = (Math.max(raw.start, raw.end) / 100) * lastIdx;
      } else {
        return;
      }
      const startIdx = Math.max(0, Math.min(lastIdx, Math.floor(lo)));
      const endIdx = Math.max(0, Math.min(lastIdx, Math.ceil(hi)));
      const startEntry = WELL_PROFILE_DATA[startIdx];
      const endEntry = WELL_PROFILE_DATA[endIdx];

      if (chart.mode === "depth") {
        const { min: dMin, max: dMax } = WELL_SESSION.depthAxis.range;
        const lo = Math.max(dMin, Math.min(dMax, Math.min(startEntry.depth, endEntry.depth)));
        const hi = Math.max(dMin, Math.min(dMax, Math.max(startEntry.depth, endEntry.depth)));
        if (hi <= lo) return; // empty overlap with session — keep current range
        dispatch({ type: "SET_RULER_RANGE", min: lo, max: hi });
      } else {
        const { min: tMin, max: tMax } = WELL_SESSION.timeAxis.range;
        const startMin = dateToSessionMinute(parseWellProfileDate(startEntry.date));
        const endMin = dateToSessionMinute(parseWellProfileDate(endEntry.date));
        const lo = Math.max(tMin, Math.min(tMax, Math.min(startMin, endMin)));
        const hi = Math.max(tMin, Math.min(tMax, Math.max(startMin, endMin)));
        if (hi <= lo) return;
        dispatch({ type: "SET_RULER_RANGE", min: lo, max: hi });
      }
    },
    [chart.mode, dispatch],
  );

  // Map current rulerRange back to WP_DATA index envelope so the slider
  // handles stay in the position the user dragged to. Without this, the
  // option object is rebuilt on each dispatch with `notMerge`, and ECharts
  // resets the slider to 0..100 because no `start`/`end` is bound.
  const sliderRange = useMemo(() => {
    const lastIdx = WELL_PROFILE_DATA.length - 1;
    const r = chart.rulerRange;
    if (!r) return { startPct: 0, endPct: 100 };
    let s = 0;
    let e = lastIdx;
    if (chart.mode === "depth") {
      // WP depths are monotonically increasing — outermost envelope.
      for (let i = 0; i <= lastIdx; i++) {
        if (WELL_PROFILE_DATA[i].depth <= r.min) s = i;
      }
      for (let i = lastIdx; i >= 0; i--) {
        if (WELL_PROFILE_DATA[i].depth >= r.max) e = i;
      }
    } else {
      for (let i = 0; i <= lastIdx; i++) {
        const m = dateToSessionMinute(parseWellProfileDate(WELL_PROFILE_DATA[i].date));
        if (m <= r.min) s = i;
      }
      for (let i = lastIdx; i >= 0; i--) {
        const m = dateToSessionMinute(parseWellProfileDate(WELL_PROFILE_DATA[i].date));
        if (m >= r.max) e = i;
      }
    }
    if (e < s) e = s;
    return {
      startPct: (s / lastIdx) * 100,
      endPct: (e / lastIdx) * 100,
    };
  }, [chart.rulerRange, chart.mode]);

  const option = useMemo((): EChartsOption => {
    const c = getChartColors();
    const { data, maxDepthFt } = WELL_SESSION.wellProfile;
    const { depthFt: currentDepthFt } = WELL_SESSION.cursor;

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
          return `<span style="color:${c.fgMuted}">${axisValue}</span>&nbsp;&nbsp;<span style="color:${c.accent};font-weight:600">${value.toLocaleString()} ft</span>`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: maxDepthFt,
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
            formatter: (params: { value: number | string | Date }) =>
              `${Math.round(Number(params.value))} ft`,
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
            formatter: `${currentDepthFt.toLocaleString()}`,
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
        chart.wellProfileSlider && !chart.liveMode
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
  }, [settings.theme, chart.wellProfileSlider, chart.liveMode, chart.rulerRange, sliderRange.startPct, sliderRange.endPct, fsScale]);

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
          {WELL_SESSION.wellProfile.maxDepthFt.toLocaleString()} ft
        </span>
      </div>
    </div>
  );
}
