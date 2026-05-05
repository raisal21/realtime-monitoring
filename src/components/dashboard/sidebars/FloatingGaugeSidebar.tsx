import { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useUi, useSettings, FS_SCALE } from "@/stores/dashboard-store";
import { GAUGES } from "@/data/dashboard-static";
import { IconButton } from "@/components/form";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";

const GAUGE_SIDEBAR_WIDTH = 260;

interface GaugeConfig {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: "ok" | "warning" | "critical";
  min: number;
  max: number;
}

const GAUGE_RANGES: Record<string, { min: number; max: number }> = {
  rpm:    { min: 0, max: 200  },
  wob:    { min: 0, max: 50   },
  torque: { min: 0, max: 10   },
  spp:    { min: 0, max: 3500 },
  hkld:   { min: 0, max: 300  },
  gamma:  { min: 0, max: 150  },
  rop:    { min: 0, max: 60   },
  h2s:    { min: 0, max: 50   },
  inc:    { min: 0, max: 90   },
  azi:    { min: 0, max: 360  },
};

// Status background helpers — background tint only, no colored border.
// Left accent stripe via inset box-shadow as a secondary non-color cue (accessibility).
function statusBg(status: GaugeConfig["status"]) {
  if (status === "critical") return "bg-[color-mix(in_srgb,var(--theme-critical)_12%,var(--theme-surface))] shadow-[inset_3px_0_0_var(--theme-critical)] animate-[gauge-critical-pulse_2.2s_ease-in-out_infinite]";
  if (status === "warning")  return "bg-[color-mix(in_srgb,var(--theme-warning)_8%,var(--theme-surface))] shadow-[inset_3px_0_0_var(--theme-warning)]";
  return "bg-(--theme-surface)";
}

// ─── Radial gauge (ECharts) ──────────────────────────────────────────────────

function RadialGaugeCard({ gauge, theme, fsScale }: { gauge: GaugeConfig; theme: string; fsScale: number }) {
  const buildOption = useCallback((): EChartsOption => {
    const c = getChartColors();
    const numVal = parseFloat(gauge.value.replace(/,/g, ""));

    const statusColor =
      gauge.status === "critical" ? c.critical
      : gauge.status === "warning" ? c.warning
      : c.ok;

    return {
      animation: gauge.status !== "critical",
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: gauge.min,
          max: gauge.max,
          radius: "88%",
          center: ["50%", "64%"],
          pointer: {
            show: true,
            length: "52%",
            width: 2.5,
            itemStyle: { color: statusColor },
          },
          progress: {
            show: true,
            width: 6,
            roundCap: true,
            itemStyle: { color: statusColor },
          },
          axisLine: {
            roundCap: true,
            lineStyle: { width: 6, color: [[1, c.border]] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: {
            show: true,
            size: 6,
            showAbove: true,
            itemStyle: { color: statusColor, borderColor: c.surface, borderWidth: 1 },
          },
          detail: {
            show: true,
            offsetCenter: [0, "28%"],
            formatter: `{value}\n{unit|${gauge.unit}}`,
            rich: {
              unit: {
                fontSize: 9 * fsScale,
                color: c.fgMuted,
                fontFamily: "Share Tech Mono, monospace",
                lineHeight: 14,
              },
            },
            fontSize: 17 * fsScale,
            fontFamily: "Share Tech Mono, monospace",
            color: gauge.status === "critical" ? c.critical
                 : gauge.status === "warning"  ? c.warning
                 : c.fg,
            fontWeight: "bold",
          },
          title: {
            show: true,
            offsetCenter: [0, "-46%"],
            fontSize: 9 * fsScale,
            fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 700,
            color: c.fgMuted,
          },
          data: [{ value: numVal, name: gauge.label }],
        },
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: gauge.min,
          max: gauge.max,
          radius: "68%",
          center: ["50%", "64%"],
          pointer: { show: false },
          progress: { show: false },
          axisLine: { lineStyle: { width: 1, color: [[1, c.borderSubtle]] } },
          axisTick: {
            show: true,
            distance: -5,
            length: 3,
            lineStyle: { color: c.border, width: 0.8 },
            splitNumber: 4,
          },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
          title: { show: false },
          data: [{ value: numVal }],
        },
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gauge, theme, fsScale]);

  return (
    <div
      className={cn(
        "overflow-hidden border border-(--theme-border) rounded-(--radius-badge)",
        statusBg(gauge.status),
      )}
      style={{ height: 118 }}
      role="img"
      aria-label={`${gauge.label}: ${gauge.value} ${gauge.unit} — ${gauge.status}`}
    >
      <ReactECharts
        option={buildOption()}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}

// ─── Flat value card (ROP, H2S, Gamma) ───────────────────────────────────────

function ValueCard({ gauge }: { gauge: GaugeConfig }) {
  const numVal = parseFloat(gauge.value.replace(/,/g, ""));
  const pct = Math.min(100, (numVal / gauge.max) * 100);

  const barColor =
    gauge.status === "critical" ? "var(--theme-critical)"
    : gauge.status === "warning" ? "var(--theme-warning)"
    : "var(--theme-ok)";

  const valueColor =
    gauge.status === "critical" ? "var(--theme-critical)"
    : gauge.status === "warning" ? "var(--theme-warning)"
    : "var(--theme-fg)";

  return (
    <div
      className={cn(
        "flex flex-col justify-between px-2.5 py-2",
        "border border-(--theme-border) rounded-(--radius-badge)",
        statusBg(gauge.status),
      )}
      style={{ height: 80 }}
      role="status"
      aria-label={`${gauge.label}: ${gauge.value} ${gauge.unit} — ${gauge.status}`}
    >
      <div className="flex items-center justify-between">
        <span className="label-mono">{gauge.label}</span>
        <span
          className="font-['Share_Tech_Mono',monospace] text-fs-9 uppercase tracking-wider"
          style={{ color: barColor }}
          aria-hidden="true"
        >
          {gauge.status !== "ok" ? gauge.status : ""}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="font-['Share_Tech_Mono',monospace] text-fs-24 leading-none font-bold tabular-nums"
          style={{ color: valueColor }}
        >
          {gauge.value}
        </span>
        <span className="unit-label">{gauge.unit}</span>
      </div>

      <div className="h-[2px] bg-(--theme-border) rounded-full overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ─── Compass card (Inc + Azi) ─────────────────────────────────────────────────

function CompassCard({ inc, azi, fsScale }: { inc: GaugeConfig; azi: GaugeConfig; fsScale: number }) {
  const incVal = parseFloat(inc.value);
  const aziVal = parseFloat(azi.value.replace(/,/g, ""));

  // SVG compass: azimuth 0=N clockwise. SVG 0° = east, so offset by -90.
  const aziRad = ((aziVal - 90) * Math.PI) / 180;
  const cx = 30;
  const cy = 30;
  const r = 20;
  const pxEnd = cx + 16 * Math.cos(aziRad);
  const pyEnd = cy + 16 * Math.sin(aziRad);
  const pxTail = cx - 7 * Math.cos(aziRad);
  const pyTail = cy - 7 * Math.sin(aziRad);

  // Inc tilt arc: semicircle from left (180°) to right (0°)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcR = 20;
  const arcCx = 30;
  const arcCy = 32;
  const incPct = Math.min(1, incVal / 90);
  const arcEndDeg = 180 - incPct * 180;

  const describeArc = (startDeg: number, endDeg: number) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = arcCx + arcR * Math.cos(s);
    const y1 = arcCy + arcR * Math.sin(s);
    const x2 = arcCx + arcR * Math.cos(e);
    const y2 = arcCy + arcR * Math.sin(e);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = endDeg < startDeg ? 0 : 1;
    return `M ${x1} ${y1} A ${arcR} ${arcR} 0 ${large} ${sweep} ${x2} ${y2}`;
  };

  return (
    <div
      className="flex border border-(--theme-border) rounded-(--radius-badge) bg-(--theme-surface) overflow-hidden"
      style={{ height: 108 }}
    >
      {/* Azimuth compass */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-1 border-r border-(--theme-border-subtle) py-2"
        role="img"
        aria-label={`Azimuth: ${aziVal.toFixed(0)} degrees`}
      >
        <svg width="62" height="62" viewBox="0 0 60 60" aria-hidden="true">
          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="var(--theme-fg-dim)" strokeWidth="0.75" />
          {/* Tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const angle = ((deg - 90) * Math.PI) / 180;
            const isMajor = deg % 90 === 0;
            const innerR = isMajor ? r - 2 : r;
            return (
              <line
                key={deg}
                x1={cx + innerR * Math.cos(angle)}
                y1={cy + innerR * Math.sin(angle)}
                x2={cx + (r + 3) * Math.cos(angle)}
                y2={cy + (r + 3) * Math.sin(angle)}
                stroke={isMajor ? "var(--theme-fg-muted)" : "var(--theme-fg-dim)"}
                strokeWidth={isMajor ? 1 : 0.5}
              />
            );
          })}
          {/* Cardinal labels */}
          <text x={cx} y={cy - r - 7} textAnchor="middle" dominantBaseline="middle" fontSize={7 * fsScale} fontWeight="700" fill="var(--theme-fg)" fontFamily="Share Tech Mono, monospace">N</text>
          <text x={cx} y={cy + r + 8} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">S</text>
          <text x={cx + r + 8} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">E</text>
          <text x={cx - r - 8} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">W</text>
          {/* Tail (opposite direction) */}
          <line x1={cx} y1={cy} x2={pxTail} y2={pyTail} stroke="var(--theme-fg-dim)" strokeWidth="1" strokeLinecap="round" />
          {/* Pointer */}
          <line x1={cx} y1={cy} x2={pxEnd} y2={pyEnd} stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" />
          {/* Center pivot */}
          <circle cx={cx} cy={cy} r="2.5" fill="var(--theme-accent)" />
        </svg>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-11 text-(--theme-fg) tabular-nums leading-none font-semibold">
          {aziVal.toFixed(0)}°
        </span>
        <span className="label-mono">AZI</span>
      </div>

      {/* Inclination tilt meter */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
        role="img"
        aria-label={`Inclination: ${incVal.toFixed(1)} degrees`}
      >
        <svg width="62" height="46" viewBox="0 0 60 46" aria-hidden="true">
          {/* Background arc */}
          <path
            d={describeArc(180, 0)}
            fill="none"
            stroke="var(--theme-fg-dim)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {incPct > 0 && (
            <path
              d={describeArc(180, arcEndDeg)}
              fill="none"
              stroke="var(--theme-accent)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {/* Endpoint dot */}
          {incPct > 0 && (
            <circle
              cx={arcCx + arcR * Math.cos(toRad(arcEndDeg))}
              cy={arcCy + arcR * Math.sin(toRad(arcEndDeg))}
              r="3"
              fill="var(--theme-accent)"
            />
          )}
          {/* Scale labels */}
          <text x="5" y={arcCy + 12} textAnchor="middle" fontSize={7 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">0</text>
          <text x="55" y={arcCy + 12} textAnchor="middle" fontSize={7 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">90</text>
        </svg>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-11 text-(--theme-fg) tabular-nums leading-none font-semibold">
          {incVal.toFixed(1)}°
        </span>
        <span className="label-mono">INCL</span>
      </div>
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1 mb-0.5">
      <span className="label-mono">{label}</span>
      <div className="flex-1 h-px bg-(--theme-border)" />
    </div>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function FloatingGaugeSidebar({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];

  const gaugeMap = Object.fromEntries(
    GAUGES.map((g) => [g.id, { ...g, ...GAUGE_RANGES[g.id] ?? { min: 0, max: 100 } }])
  ) as Record<string, GaugeConfig>;

  const radialIds = ["rpm", "wob", "spp", "hkld", "torque"] as const;
  const valueIds  = ["rop", "h2s", "gamma"] as const;
  const incGauge  = gaugeMap["inc"];
  const aziGauge  = gaugeMap["azi"];

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 z-30",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "flex flex-col overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.4)]",
        "animate-sidebar-slide-in-right",
      )}
      style={{
        width: GAUGE_SIDEBAR_WIDTH,
        right: rightPosition,
        transition: "right 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      aria-label="Realtime gauges"
    >
      <div className="flex items-center px-rt-pad-sm py-rt-pad-sm border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">Gauges</span>
        <IconButton
          intent="ghost"
          size="sm"
          onClick={() => dispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
          aria-label="Collapse gauges sidebar"
          title="Collapse (Cmd+.)"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 flex flex-col gap-1.5">

        <SectionLabel label="Drill / Hydraulics" />
        <div className="grid grid-cols-2 gap-1.5">
          {radialIds.map((id) => (
            <RadialGaugeCard key={id} gauge={gaugeMap[id]} theme={settings.theme} fsScale={fsScale} />
          ))}
        </div>

        <SectionLabel label="Rates / Geo" />
        <div className="grid grid-cols-2 gap-1.5">
          {valueIds.map((id) => (
            <ValueCard key={id} gauge={gaugeMap[id]} />
          ))}
        </div>

        <SectionLabel label="Directional" />
        {incGauge && aziGauge && (
          <CompassCard inc={incGauge} azi={aziGauge} fsScale={fsScale} />
        )}

      </div>
    </aside>
  );
}
