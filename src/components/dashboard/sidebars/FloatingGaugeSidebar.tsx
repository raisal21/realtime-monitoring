import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, type EChartsOption } from "@/lib/echarts";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useUi, useSettings, FS_SCALE } from "@/store/app-store";
import { GAUGES } from "@/data/dashboard-static";
import { IconButton } from "@/components/ui/form";
import { getChartColors } from "@/lib/echarts-theme";
import { cn } from "@/lib/utils";
import {
  type UnitSystem,
  type Quantity,
  formatQuantity,
  formatQuantityBounds,
} from "@/lib/units";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_STREAMS } from "@/config/role";
import { StreamDef } from "@/domain/constants";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import { LIVE_WELL_ID } from "@/data/wells";

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

const GAUGE_BOUNDS: Record<string, {
  kind: "load" | "pressure" | "rop" | "scalar";
  min: number;
  max: number;
  unit?: string;
}> = {
  rpm:    { kind: "scalar", min: 0, max: 200, unit: "rpm" },
  wob:    { kind: "load",   min: 0, max: 178 },
  torque: { kind: "scalar", min: 0, max: 10, unit: "klbf·ft" },
  spp:    { kind: "pressure", min: 0, max: 207 },
  hkld:   { kind: "load",   min: 0, max: 1112 },
  gamma:  { kind: "scalar", min: 0, max: 150, unit: "gAPI" },
  rop:    { kind: "rop",    min: 0, max: 18.3 },
  h2s:    { kind: "scalar", min: 0, max: 50, unit: "ppm" },
  inc:    { kind: "scalar", min: 0, max: 90, unit: "°" },
  azi:    { kind: "scalar", min: 0, max: 360, unit: "°" },
};

function quantityWithValue(q: Quantity, v: number): Quantity {
  switch (q.kind) {
    case "scalar":   return { ...q, value: v };
    case "load":     return { ...q, valueKN: v };
    case "pressure": return { ...q, valueBar: v };
    case "rop":      return { ...q, valueMHr: v };
    case "depth":    return { ...q, valueM: v };
  }
}

function buildGaugeConfig(
  g: typeof GAUGES[number],
  liveValue: number | undefined,
  unitSystem: UnitSystem,
): GaugeConfig {
  const bounds = GAUGE_BOUNDS[g.id] ?? { kind: "scalar" as const, min: 0, max: 100, unit: "" };
  const quantity = liveValue !== undefined
    ? quantityWithValue(g.quantity, liveValue)
    : g.quantity;
  const display = formatQuantity(quantity, unitSystem);

  let minMax: { min: number; max: number; unit: string };
  if (bounds.kind === "scalar") {
    minMax = { min: bounds.min, max: bounds.max, unit: bounds.unit ?? "" };
  } else {
    minMax = formatQuantityBounds(
      { kind: bounds.kind },
      bounds.min,
      bounds.max,
      unitSystem,
    );
  }

  return {
    id: g.id,
    label: g.label,
    value: display.value,
    unit: display.unit,
    status: g.status,
    min: minMax.min,
    max: minMax.max,
  };
}

function statusBg(status: GaugeConfig["status"]) {
  if (status === "critical") return "bg-[color-mix(in_srgb,var(--theme-critical)_12%,var(--theme-surface))] shadow-[inset_3px_0_0_var(--theme-critical)] animate-[gauge-critical-pulse_2.2s_ease-in-out_infinite]";
  if (status === "warning")  return "bg-[color-mix(in_srgb,var(--theme-warning)_8%,var(--theme-surface))] shadow-[inset_3px_0_0_var(--theme-warning)]";
  return "bg-(--theme-surface)";
}

function streamToCode(s: "drill" | "geo"): StreamDef {
  return s === "drill" ? StreamDef.DRILL : StreamDef.GEO;
}

function getLatestValueForGauge(gaugeId: string, stream: "drill" | "geo"): number | undefined {
  const state = globalRigStore.getState();
  const slice = stream === "drill" ? state.drillStream : state.geoStream;
  if (!slice.length) return undefined;
  const latest = slice[slice.length - 1] as unknown as Record<string, number | undefined>;
  const v = latest[gaugeId];
  return typeof v === "number" ? v : undefined;
}

// Subscribes to the appropriate stream slice; coalesces with rAF; returns
// the latest canonical-metric value for the named gauge.
function useLiveGaugeValue(
  gaugeId: string,
  stream: "drill" | "geo",
  enabled: boolean,
): number | undefined {
  const [val, setVal] = useState<number | undefined>(() =>
    enabled ? getLatestValueForGauge(gaugeId, stream) : undefined,
  );
  const pending = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      pending.current = null;
      const v = getLatestValueForGauge(gaugeId, stream);
      if (v !== undefined) setVal(v);
    };
    const unsub = globalRigStore.subscribe(
      (s) => (stream === "drill" ? s.drillStream : s.geoStream),
      () => {
        if (pending.current !== null) return;
        pending.current = requestAnimationFrame(flush);
      },
    );
    flush();
    return () => {
      unsub();
      if (pending.current !== null) {
        cancelAnimationFrame(pending.current);
        pending.current = null;
      }
    };
  }, [gaugeId, stream, enabled]);

  return enabled ? val : undefined;
}

// ─── Radial gauge (ECharts, imperative setOption per rAF) ────────────────────

function RadialGaugeCard({
  gauge,
  source,
  showLive,
  theme,
  unitSystem,
  fsScale,
}: {
  gauge: typeof GAUGES[number];
  source: "drill" | "geo";
  showLive: boolean;
  theme: string;
  unitSystem: UnitSystem;
  fsScale: number;
}) {
  const chartRef = useRef<ReactECharts>(null);
  const pending = useRef<number | null>(null);

  const buildOption = useCallback((): EChartsOption => {
    const c = getChartColors();
    const liveValue = showLive ? getLatestValueForGauge(gauge.id, source) : undefined;
    const cfg = buildGaugeConfig(gauge, liveValue, unitSystem);
    const numVal = parseFloat(cfg.value.replace(/,/g, ""));

    const statusColor =
      cfg.status === "critical" ? c.critical
      : cfg.status === "warning" ? c.warning
      : c.ok;

    return {
      animation: cfg.status !== "critical",
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: cfg.min,
          max: cfg.max,
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
            formatter: `{value}\n{unit|${cfg.unit}}`,
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
            color: cfg.status === "critical" ? c.critical
                 : cfg.status === "warning"  ? c.warning
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
          data: [{ value: numVal, name: cfg.label }],
        },
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: cfg.min,
          max: cfg.max,
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
  }, [gauge, source, showLive, theme, unitSystem, fsScale]);

  useEffect(() => {
    const ec = chartRef.current?.getEchartsInstance();
    if (!ec) return;
    ec.setOption(buildOption(), { lazyUpdate: true });
    if (!showLive) return;

    const flush = () => {
      pending.current = null;
      const inst = chartRef.current?.getEchartsInstance();
      if (!inst) return;
      inst.setOption(buildOption(), { lazyUpdate: true });
    };
    const unsub = globalRigStore.subscribe(
      (s) => (source === "drill" ? s.drillStream : s.geoStream),
      () => {
        if (pending.current !== null) return;
        pending.current = requestAnimationFrame(flush);
      },
    );
    return () => {
      unsub();
      if (pending.current !== null) {
        cancelAnimationFrame(pending.current);
        pending.current = null;
      }
    };
  }, [source, showLive, buildOption]);

  // Wrapper status selector: re-renders only on threshold crossings (status
  // is a string; equality check skips re-render while values stay in tier).
  // The inner ECharts canvas continues to update imperatively via setOption.
  const status = useStore(globalRigStore, (s) => {
    const stream = source === "drill" ? s.drillStream : s.geoStream;
    const v = stream.length
      ? (stream[stream.length - 1] as Record<string, number | undefined>)[gauge.id]
      : undefined;
    return buildGaugeConfig(gauge, v, unitSystem).status;
  });
  const ariaLabel = buildGaugeConfig(gauge, undefined, unitSystem).label;

  return (
    <div
      className={cn(
        "overflow-hidden border border-(--theme-border) rounded-(--radius-badge)",
        statusBg(status),
      )}
      style={{ height: 118 }}
      role="img"
      aria-label={ariaLabel}
    >
      <ReactECharts
        ref={chartRef}
        echarts={echarts}
        option={{}}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={false}
        lazyUpdate
      />
    </div>
  );
}

// ─── Value card (rop, h2s, gamma) — state-based ──────────────────────────────

function ValueCard({
  gauge,
  source,
  showLive,
  unitSystem,
}: {
  gauge: typeof GAUGES[number];
  source: "drill" | "geo";
  showLive: boolean;
  unitSystem: UnitSystem;
}) {
  const liveValue = useLiveGaugeValue(gauge.id, source, showLive);
  const cfg = buildGaugeConfig(gauge, liveValue, unitSystem);
  const numVal = parseFloat(cfg.value.replace(/,/g, ""));
  const pct = Math.min(100, (numVal / cfg.max) * 100);

  const barColor =
    cfg.status === "critical" ? "var(--theme-critical)"
    : cfg.status === "warning" ? "var(--theme-warning)"
    : "var(--theme-ok)";

  const valueColor =
    cfg.status === "critical" ? "var(--theme-critical)"
    : cfg.status === "warning" ? "var(--theme-warning)"
    : "var(--theme-fg)";

  return (
    <div
      className={cn(
        "flex flex-col justify-between px-2.5 py-2",
        "border border-(--theme-border) rounded-(--radius-badge)",
        statusBg(cfg.status),
      )}
      style={{ height: 80 }}
      role="status"
      aria-label={`${cfg.label}: ${cfg.value} ${cfg.unit} — ${cfg.status}`}
    >
      <div className="flex items-center justify-between">
        <span className="label-mono">{cfg.label}</span>
        <span
          className="font-['Share_Tech_Mono',monospace] text-fs-9 uppercase tracking-wider"
          style={{ color: barColor }}
          aria-hidden="true"
        >
          {cfg.status !== "ok" ? cfg.status : ""}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="font-['Share_Tech_Mono',monospace] text-fs-24 leading-none font-bold tabular-nums"
          style={{ color: valueColor }}
        >
          {cfg.value}
        </span>
        <span className="unit-label">{cfg.unit}</span>
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

// ─── Compass card (inc + azi) ────────────────────────────────────────────────

function CompassCard({
  incGauge,
  aziGauge,
  showLive,
  unitSystem,
  fsScale,
}: {
  incGauge: typeof GAUGES[number];
  aziGauge: typeof GAUGES[number];
  showLive: boolean;
  unitSystem: UnitSystem;
  fsScale: number;
}) {
  const incLive = useLiveGaugeValue("inc", "geo", showLive);
  const aziLive = useLiveGaugeValue("azi", "geo", showLive);
  const inc = buildGaugeConfig(incGauge, incLive, unitSystem);
  const azi = buildGaugeConfig(aziGauge, aziLive, unitSystem);

  const incVal = parseFloat(inc.value);
  const aziVal = parseFloat(azi.value.replace(/,/g, ""));

  const aziRad = ((aziVal - 90) * Math.PI) / 180;
  const cx = 30;
  const cy = 30;
  const r = 20;
  const pxEnd = cx + 16 * Math.cos(aziRad);
  const pyEnd = cy + 16 * Math.sin(aziRad);
  const pxTail = cx - 7 * Math.cos(aziRad);
  const pyTail = cy - 7 * Math.sin(aziRad);

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
      <div
        className="flex-1 flex flex-col items-center justify-center gap-1 border-r border-(--theme-border-subtle) py-2"
        role="img"
        aria-label={`Azimuth: ${aziVal.toFixed(0)} degrees`}
      >
        <svg width="62" height="62" viewBox="0 0 60 60" aria-hidden="true">
          <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="var(--theme-fg-dim)" strokeWidth="0.75" />
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
          <text x={cx} y={cy - r - 7} textAnchor="middle" dominantBaseline="middle" fontSize={7 * fsScale} fontWeight="700" fill="var(--theme-fg)" fontFamily="Share Tech Mono, monospace">N</text>
          <text x={cx} y={cy + r + 8} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">S</text>
          <text x={cx + r + 8} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">E</text>
          <text x={cx - r - 8} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={6 * fsScale} fill="var(--theme-fg-dim)" fontFamily="Share Tech Mono, monospace">W</text>
          <line x1={cx} y1={cy} x2={pxTail} y2={pyTail} stroke="var(--theme-fg-dim)" strokeWidth="1" strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={pxEnd} y2={pyEnd} stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="2.5" fill="var(--theme-accent)" />
        </svg>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-11 text-(--theme-fg) tabular-nums leading-none font-semibold">
          {aziVal.toFixed(0)}°
        </span>
        <span className="label-mono">AZI</span>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
        role="img"
        aria-label={`Inclination: ${incVal.toFixed(1)} degrees`}
      >
        <svg width="62" height="46" viewBox="0 0 60 46" aria-hidden="true">
          <path
            d={describeArc(180, 0)}
            fill="none"
            stroke="var(--theme-fg-dim)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {incPct > 0 && (
            <path
              d={describeArc(180, arcEndDeg)}
              fill="none"
              stroke="var(--theme-accent)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {incPct > 0 && (
            <circle
              cx={arcCx + arcR * Math.cos(toRad(arcEndDeg))}
              cy={arcCy + arcR * Math.sin(toRad(arcEndDeg))}
              r="3"
              fill="var(--theme-accent)"
            />
          )}
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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1 mb-0.5">
      <span className="label-mono">{label}</span>
      <div className="flex-1 h-px bg-(--theme-border)" />
    </div>
  );
}

function GaugePlaceholder({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-dim) uppercase tracking-[0.1em] text-center">
        {text}
      </span>
    </div>
  );
}

export function FloatingGaugeSidebar({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();
  const { state: settings } = useSettings();
  const fsScale = FS_SCALE[settings.fontSize];
  const { role } = useAuth();
  const status = useStore(globalRigStore, (s) => s.status);
  const { well } = useCurrentWell();

  const isLive = well?.id === LIVE_WELL_ID;
  const showLive = isLive && status === "ONLINE";
  const allowedStreams = role ? ROLE_STREAMS[role] : null;

  const filteredGauges = useMemo(() => {
    if (!allowedStreams) return [];
    return GAUGES.filter((g) => allowedStreams.has(streamToCode(g.stream)));
  }, [allowedStreams]);

  const byId = useMemo(() => {
    const m = new Map<string, typeof GAUGES[number]>();
    for (const g of filteredGauges) m.set(g.id, g);
    return m;
  }, [filteredGauges]);

  const radialIds = ["rpm", "wob", "spp", "hkld", "torque"] as const;
  const valueIds  = ["rop", "h2s", "gamma"] as const;
  const incGauge  = byId.get("inc");
  const aziGauge  = byId.get("azi");

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

      {!isLive ? (
        <GaugePlaceholder text="No live feed for this well" />
      ) : status !== "ONLINE" ? (
        <GaugePlaceholder text="Connecting…" />
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 flex flex-col gap-1.5">
          {radialIds.some((id) => byId.has(id)) && (
            <SectionLabel label="Drill / Hydraulics" />
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {radialIds.flatMap((id) => {
              const g = byId.get(id);
              if (!g) return [];
              return [
                <RadialGaugeCard
                  key={g.id}
                  gauge={g}
                  source={g.stream}
                  showLive={showLive}
                  theme={settings.theme}
                  unitSystem={settings.unitSystem}
                  fsScale={fsScale}
                />,
              ];
            })}
          </div>

          {valueIds.some((id) => byId.has(id)) && (
            <SectionLabel label="Rates / Geo" />
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {valueIds.flatMap((id) => {
              const g = byId.get(id);
              if (!g) return [];
              return [
                <ValueCard
                  key={g.id}
                  gauge={g}
                  source={g.stream}
                  showLive={showLive}
                  unitSystem={settings.unitSystem}
                />,
              ];
            })}
          </div>

          {incGauge && aziGauge && (
            <>
              <SectionLabel label="Directional" />
              <CompassCard
                incGauge={incGauge}
                aziGauge={aziGauge}
                showLive={showLive}
                unitSystem={settings.unitSystem}
                fsScale={fsScale}
              />
            </>
          )}
        </div>
      )}
    </aside>
  );
}
