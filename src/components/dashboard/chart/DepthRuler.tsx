import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  WELL_SESSION,
  presetToDepthSpanM,
  PRESET_TO_MINUTES,
  timeRangeToDepthRange,
} from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { formatDepth, mToFt } from "@/lib/units";
import { cn } from "@/lib/utils";

const DEFAULT_DEPTH_SPAN = 30;

function getEffectiveRange(
  isPrimary: boolean,
  liveMode: boolean,
  rulerRange: { min: number; max: number } | null,
  rangePreset: string | null,
  sessionMin: number,
  sessionMax: number,
) {
  if (isPrimary) {
    if (liveMode) {
      const currentDepth = WELL_SESSION.cursor.depthM;
      const depthSpan = rangePreset
        ? presetToDepthSpanM(rangePreset)
        : DEFAULT_DEPTH_SPAN;
      const start = Math.max(sessionMin, currentDepth - depthSpan);
      return { min: start, max: currentDepth };
    }
    return rulerRange ?? { min: sessionMin, max: sessionMax };
  }
  // Non-primary (chart.mode === "time"): project the active time window onto
  // the depth axis so depth ruler tracks the same visible span as the time
  // ruler, log tracks, and well-profile slider.
  if (liveMode) {
    const spanMinutes = rangePreset
      ? PRESET_TO_MINUTES[rangePreset] ?? 60
      : 60;
    const tEnd = WELL_SESSION.timeAxis.range.max;
    const tStart = Math.max(WELL_SESSION.timeAxis.range.min, tEnd - spanMinutes);
    return (
      timeRangeToDepthRange(tStart, tEnd) ?? { min: sessionMin, max: sessionMax }
    );
  }
  if (rulerRange) {
    return (
      timeRangeToDepthRange(rulerRange.min, rulerRange.max) ?? {
        min: sessionMin,
        max: sessionMax,
      }
    );
  }
  return { min: sessionMin, max: sessionMax };
}

export function DepthRuler({ isPrimary }: { isPrimary: boolean }) {
  const { state: chart, dispatch: chartDispatch } = useChart();
  const { state: settings } = useSettings();
  const echartsRef = useRef<ReactECharts>(null);
  const axisPointerActive = useRef(false);

  const { min: sessionMin, max: sessionMax } = WELL_SESSION.depthAxis.range;
  const yRange = getEffectiveRange(
    isPrimary,
    chart.liveMode,
    chart.rulerRange,
    chart.rangePreset,
    sessionMin,
    sessionMax,
  );

  useEffect(() => {
    const ec = echartsRef.current?.getEchartsInstance();
    if (!ec) return;

    const { crosshairValue } = chart;

    if (crosshairValue !== null) {
      const depthValue =
        yRange.min + crosshairValue * (yRange.max - yRange.min);
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
  }, [chart.crosshairValue, yRange.min, yRange.max]);

  const sliderAxisMin = sessionMin;
  const sliderAxisMax = sessionMax;
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
      chartDispatch({ type: "SET_LOG_TRACK_RANGE", min: lo, max: hi });
    },
    [chartDispatch, sliderAxisMin, sliderAxisMax, isPrimary],
  );

  const handleMouseMove = isPrimary
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(
          0,
          Math.min(1, (e.clientY - rect.top) / rect.height),
        );
        chartDispatch({ type: "SET_CROSSHAIR_VALUE", value: pct });
      }
    : undefined;

  const handleMouseLeave = isPrimary
    ? () => {
        chartDispatch({ type: "SET_CROSSHAIR_VALUE", value: null });
      }
    : undefined;

  const showDataZoomSlider =
    isPrimary && chart.mode === "depth" && chart.rulerSlider && !chart.liveMode;

  const fsScale = FS_SCALE[settings.fontSize];

  // Adaptive tick density (canonical: meters). Depth range can span up to
  // ~400 m; zoom can narrow well below 30 m. Steps: 15→8→3→1 m.
  const span = yRange.max - yRange.min;
  const { tickInterval, labelInterval } =
    span > 240
      ? { tickInterval: 15, labelInterval: 60 }
      : span > 60
      ? { tickInterval: 8, labelInterval: 30 }
      : span > 15
      ? { tickInterval: 3, labelInterval: 8 }
      : { tickInterval: 1, labelInterval: 3 };

  // Snap axis bounds to tickInterval so generated ticks land on round numbers
  // (formatter relies on `val % labelInterval === 0`). Without snapping, float
  // depths from the generator (e.g. 13905.4) shift every tick off the grid.
  const axisMin = Math.floor(yRange.min / tickInterval) * tickInterval;
  const axisMax = Math.ceil(yRange.max / tickInterval) * tickInterval;

  // Slider operates on the full session range (so its handles always represent
  // the current zoom *within the session*); start/end percentages reflect the
  // current visible window.
  const sessionSpan = sessionMax - sessionMin || 1;
  const sliderStartPct = ((yRange.min - sessionMin) / sessionSpan) * 100;
  const sliderEndPct = ((yRange.max - sessionMin) / sessionSpan) * 100;

  const option = useMemo((): EChartsOption => {
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
            formatter: (val: number) => {
              if (val % labelInterval !== 0) return "";
              const out = settings.unitSystem === "imperial" ? mToFt(val) : val;
              return Math.round(out).toLocaleString();
            },
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
                `${Math.round(Number(params.value))}`,
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
      dataZoom: showDataZoomSlider
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
    settings.theme,
    fsScale,
    isPrimary,
    axisMin,
    axisMax,
    sliderAxisMin,
    sliderAxisMax,
    sliderStartPct,
    sliderEndPct,
    showDataZoomSlider,
    chart.rulerRange,
    tickInterval,
    labelInterval,
  ]);

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
            {formatDepth(yRange.min, settings.unitSystem).value}
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
            {formatDepth(yRange.max, settings.unitSystem).value}
          </span>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          onEvents={{ datazoom: handleDataZoom }}
        />
      </div>
    </div>
  );
}
