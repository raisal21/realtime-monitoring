import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { WELL_SESSION, RANGE_PRESETS_QUICK } from "@/data/dashboard-static";
import { useChart, useSettings } from "@/stores/dashboard-store";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const presetToMinutes: Record<string, number> = Object.fromEntries(
  RANGE_PRESETS_QUICK.map((p) => [
    p.id,
    parseInt(p.id) * (p.id.includes("d") ? 24 * 60 : 60),
  ]),
);

const minutesToHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

function getEffectiveRange(
  isPrimary: boolean,
  liveMode: boolean,
  manualRange: { min: number; max: number } | null,
  rangePreset: string | null,
  sessionMin: number,
  sessionMax: number,
) {
  if (!isPrimary) return { min: sessionMin, max: sessionMax };
  if (liveMode) {
    const spanMinutes = rangePreset ? (presetToMinutes[rangePreset] ?? 60) : 60;
    const end = sessionMax;
    const start = Math.max(sessionMin, end - spanMinutes);
    return { min: start, max: end };
  }
  return manualRange ?? { min: sessionMin, max: sessionMax };
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
    chart.manualRange,
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
          type: "SET_MANUAL_RANGE",
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
    isPrimary && chart.dataZoomSlider && !chart.liveMode;

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
          interval: 5,
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
            fontSize: 9,
            fontFamily: "Share Tech Mono, monospace",
            color: labelColor,
            formatter: (val: number) =>
              val % 10 === 0 ? minutesToHHMM(val) : "",
          },
          splitLine: { show: false },
          axisPointer: {
            label: {
              show: true,
              backgroundColor: c.accent,
              color: c.fg,
              borderWidth: 0,
              fontSize: 11,
              fontFamily: "Share Tech Mono, monospace",
              padding: [3, 6],
              formatter: (params: { value: number | string | Date }) => {
                const min = Number(params.value);
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
    isPrimary,
    yRange.min,
    yRange.max,
    showDataZoomSlider,
    chart.manualRange,
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
          <span
            className={cn(
              "font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            {minutesToHHMM(yRange.min)}
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
              "font-['Share_Tech_Mono',monospace] text-[8px] tabular-nums ml-1",
              isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
            )}
          >
            {minutesToHHMM(yRange.max)}
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
