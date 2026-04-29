import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION, presetToDepthSpanFt } from "@/data/dashboard-static";
import { useChart, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const DEFAULT_DEPTH_SPAN = 100;

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
    const currentDepth = WELL_SESSION.cursor.depthFt;
    const depthSpan = rangePreset
      ? presetToDepthSpanFt(rangePreset)
      : DEFAULT_DEPTH_SPAN;
    const start = Math.max(sessionMin, currentDepth - depthSpan);
    return { min: start, max: currentDepth };
  }
  return rulerRange ?? { min: sessionMin, max: sessionMax };
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
    isPrimary && chart.mode === "depth" && chart.rulerSlider && !chart.liveMode;

  const fsScale = FS_SCALE[settings.fontSize];

  // Adaptive tick density — depth range can span up to ~1300 ft, but zoom can
  // narrow it well below 100 ft, so we step from 100→25→10→2 ft.
  const span = yRange.max - yRange.min;
  const { tickInterval, labelInterval } =
    span > 800
      ? { tickInterval: 50, labelInterval: 200 }
      : span > 200
      ? { tickInterval: 25, labelInterval: 100 }
      : span > 50
      ? { tickInterval: 10, labelInterval: 25 }
      : { tickInterval: 2, labelInterval: 10 };

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
              val % labelInterval === 0 ? Math.round(val).toLocaleString() : "",
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
        <div className="label-mono mt-0.5">ft MD</div>
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
            {yRange.min.toLocaleString()}
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
            {yRange.max.toLocaleString()}
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
