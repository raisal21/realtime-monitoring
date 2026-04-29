import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION, PRESET_TO_MINUTES, sessionMinuteToDate } from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const minutesToHHMM = (min: number) => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.floor(wrapped % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getEffectiveRange(
  isPrimary: boolean,
  liveMode: boolean,
  rulerRange: { min: number; max: number } | null,
  rangePreset: string | null,
  sessionMin: number,
  sessionMax: number,
) {
  if (!isPrimary) return { min: sessionMin, max: sessionMax };
  if (liveMode) {
    const spanMinutes = rangePreset ? (PRESET_TO_MINUTES[rangePreset] ?? 60) : 60;
    const end = sessionMax;
    const start = Math.max(sessionMin, end - spanMinutes);
    return { min: start, max: end };
  }
  return rulerRange ?? { min: sessionMin, max: sessionMax };
}

export function TimeRuler({ isPrimary }: { isPrimary: boolean }) {
  const { state: chart, dispatch: chartDispatch } = useChart();
  const { state: settings } = useSettings();
  const echartsRef = useRef<ReactECharts>(null);
  const axisPointerActive = useRef(false);

  const { min: sessionMin, max: sessionMax } = WELL_SESSION.timeAxis.range;
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
      const timeValue = yRange.min + crosshairValue * (yRange.max - yRange.min);
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
  }, [chart.crosshairValue, yRange.min, yRange.max]);

  const handleDataZoom = useCallback(
    (params: unknown) => {
      const p = params as {
        startValue?: number;
        endValue?: number;
        batch?: Array<{ startValue?: number; endValue?: number }>;
      };
      const raw = (p.batch?.[0] ?? p) as {
        startValue?: number;
        endValue?: number;
      };
      if (raw.startValue !== undefined && raw.endValue !== undefined) {
        chartDispatch({
          type: "SET_LOG_TRACK_RANGE",
          min: Math.min(raw.startValue, raw.endValue),
          max: Math.max(raw.startValue, raw.endValue),
        });
      }
    },
    [chartDispatch],
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
    isPrimary && chart.mode === "time" && chart.rulerSlider && !chart.liveMode;

  const fsScale = FS_SCALE[settings.fontSize];

  // Pick tick density based on visible span (range covers up to 7 days).
  const span = yRange.max - yRange.min;
  const { tickInterval, labelInterval } =
    span > 4320
      ? { tickInterval: 720, labelInterval: 1440 }   // > 3d:  6h ticks, daily labels
      : span > 1440
      ? { tickInterval: 240, labelInterval: 720 }    // > 1d:  4h ticks, 12h labels
      : span > 360
      ? { tickInterval: 60, labelInterval: 180 }     // > 6h:  1h ticks, 3h labels
      : span > 60
      ? { tickInterval: 15, labelInterval: 60 }      // > 1h:  15m ticks, hourly labels
      : { tickInterval: 5, labelInterval: 15 };      // ≤ 1h:  5m ticks, 15m labels

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
          min: yRange.min,
          max: yRange.max,
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
            formatter: (val: number) =>
              val % labelInterval === 0 ? minutesToHHMM(val % 1440) : "",
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
                const min = ((Number(params.value) % 1440) + 1440) % 1440;
                const h = Math.floor(min / 60);
                const m = Math.floor(min % 60);
                return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
              },
            },
          },
        },
        {
          type: "value",
          min: yRange.min,
          max: yRange.max,
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
              moveOnMouseMove: true,
              moveOnMouseWheel: true,
            },
            {
              type: "slider",
              yAxisIndex: 1,
              orient: "vertical",
              left: 0,
              right: 0,
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
            },
          ]
        : [
            {
              type: "inside",
              yAxisIndex: 1,
              filterMode: "none",
              zoomOnMouseWheel: true,
              moveOnMouseMove: true,
              moveOnMouseWheel: true,
            },
          ],
      series: [],
    };
  }, [
    settings.theme,
    fsScale,
    isPrimary,
    yRange.min,
    yRange.max,
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
        <div className="label-mono mt-0.5">UTC</div>
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
              {MONTHS[sessionMinuteToDate(yRange.min).getMonth()]}{" "}
              {sessionMinuteToDate(yRange.min).getDate()}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums">
              {minutesToHHMM(yRange.min)}
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
              {MONTHS[sessionMinuteToDate(yRange.max).getMonth()]}{" "}
              {sessionMinuteToDate(yRange.max).getDate()}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-fs-8 tabular-nums">
              {minutesToHHMM(yRange.max)}
            </span>
          </div>
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
