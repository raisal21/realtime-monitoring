"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Badge,
  StatusDot,
  Surface,
  ToggleGroup,
  ToggleItem,
  TraceColor,
  TraceItem,
  ValueReadout,
  GaugeCard,
  FilterChip,
  FeedItem,
  CriticalBanner,
  TopbarButton,
  BreadcrumbItem,
  ConnectionStatus,
  FooterStat,
  PresetSelect,
  StreamItem,
  cn,
} from "../components/components";

/* ─── Static data ──────────────────────────────────────────── */

const DRILL_TRACES = [
  { trace: "rpm" as const, name: "RPM", value: "120.4", unit: "rpm" },
  { trace: "wob" as const, name: "WOB", value: "20.1", unit: "klbs" },
  { trace: "torque" as const, name: "TORQUE", value: "4.87", unit: "klbf·ft" },
  { trace: "spp" as const, name: "SPP", value: "2,497", unit: "psi" },
  { trace: "hkld" as const, name: "HKLD", value: "201.3", unit: "klbs" },
] as const;

const GEO_TRACES = [
  { trace: "gamma" as const, name: "GR", value: "52.1", unit: "gAPI" },
  { trace: "rop" as const, name: "ROP", value: "24.8", unit: "ft/hr" },
  { trace: "gas" as const, name: "GAS", value: "8.2", unit: "%" },
  { trace: "inc" as const, name: "INC", value: "3.4", unit: "°" },
  { trace: "azi" as const, name: "AZI", value: "142", unit: "°" },
] as const;

const GAUGE_DRILL = [
  {
    label: "RPM",
    value: "120.4",
    unit: "rpm",
    status: "ok" as const,
    stream: "drill" as const,
    min: 0,
    max: 200,
  },
  {
    label: "WOB",
    value: "20.1",
    unit: "klbs",
    status: "ok" as const,
    stream: "drill" as const,
    min: 0,
    max: 40,
  },
  {
    label: "Torque",
    value: "4.87",
    unit: "klbf·ft",
    status: "warning" as const,
    stream: "drill" as const,
    min: 0,
    max: 10,
  },
  {
    label: "SPP",
    value: "2,497",
    unit: "psi",
    status: "ok" as const,
    stream: "drill" as const,
    min: 0,
    max: 3000,
  },
  {
    label: "HKLD",
    value: "201.3",
    unit: "klbs",
    status: "ok" as const,
    stream: "drill" as const,
    min: 150,
    max: 250,
  },
] as const;

const GAUGE_GEO = [
  {
    label: "Gamma",
    value: "52.1",
    unit: "gAPI",
    status: "ok" as const,
    stream: "geo" as const,
    min: 0,
    max: 150,
  },
  {
    label: "ROP",
    value: "24.8",
    unit: "ft/hr",
    status: "ok" as const,
    stream: "geo" as const,
    min: 0,
    max: 60,
  },
  {
    label: "Gas",
    value: "8.2",
    unit: "%",
    status: "critical" as const,
    stream: "geo" as const,
    min: 0,
    max: 50,
  },
  {
    label: "Inc",
    value: "3.4",
    unit: "°",
    status: "ok" as const,
    stream: "geo" as const,
    min: 0,
    max: 90,
  },
  {
    label: "Azi",
    value: "142",
    unit: "°",
    status: "ok" as const,
    stream: "geo" as const,
    min: 0,
    max: 360,
  },
] as const;

const FEED_ITEMS = [
  {
    severity: "critical" as const,
    state: "unacked" as const,
    message: "High Gas — 42.3% threshold exceeded",
    meta: "Stream: GEO · Sensor: Gas Total",
    timestamp: "14:31:52",
  },
  {
    severity: "warning" as const,
    state: "unacked" as const,
    message: "SPP drop — 2,450 psi (below 2,480 min)",
    meta: "Stream: DRILL · Sensor: Standpipe Pressure",
    timestamp: "14:28:17",
  },
  {
    severity: "info" as const,
    state: "acked" as const,
    message: "Connection re-established after 3s dropout",
    meta: "System · WebSocket reconnect #2",
    timestamp: "14:21:05",
  },
  {
    severity: "note" as const,
    state: "acked" as const,
    message: "Pipe change completed — back to drilling",
    meta: "Ahmad R. · Driller · ft 12,540",
    timestamp: "14:18:33",
  },
  {
    severity: "info" as const,
    state: "resolved" as const,
    message: "RPM stabilized after correction",
    meta: "Resolved · Acked by Ahmad R.",
    timestamp: "14:05:11",
  },
] as const;

const DEPTH_TICKS = [
  { depth: "12,500", pct: 0, major: true },
  { depth: "12,510", pct: 10, major: false },
  { depth: "12,520", pct: 20, major: false },
  { depth: "12,530", pct: 30, major: true },
  { depth: "12,540", pct: 40, major: false },
  { depth: "12,550", pct: 50, major: false },
  { depth: "12,563", pct: 60, major: true },
  { depth: "12,570", pct: 70, major: false },
  { depth: "12,580", pct: 80, major: false },
  { depth: "12,590", pct: 90, major: true },
] as const;

const PRESET_OPTIONS = [
  { value: "full-drill", label: "Full Drill View" },
  { value: "geo-focus", label: "Geo Focus" },
  { value: "hydraulics", label: "Hydraulics Only" },
  { value: "directional", label: "Directional Survey" },
] as const;

/* ─── Live Clock ───────────────────────────────────────────── */
function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ─── Static SVG chart placeholders ───────────────────────── */
function ChartPlaceholder({
  traces,
}: {
  traces: Array<{ color: string; points: string; opacity?: number }>;
}) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      preserveAspectRatio="none"
      viewBox="0 0 100 200"
    >
      {traces.map((t, i) => (
        <polyline
          key={i}
          fill="none"
          stroke={t.color}
          strokeWidth="1.2"
          opacity={t.opacity ?? 0.8}
          points={t.points}
        />
      ))}
    </svg>
  );
}

/* ─── Track header with trace chips ────────────────────────── */
function TrackHeader({
  title,
  hz,
  stream,
  chips,
}: {
  title: string;
  hz: string;
  stream: "drill" | "geo";
  chips: Array<{
    trace: React.ComponentProps<typeof TraceColor>["trace"];
    name: string;
    value: string;
  }>;
}) {
  return (
    <div
      className={cn(
        "flex-shrink-0 px-[10px] py-[6px]",
        "border-b border-(--theme-border)",
        stream === "drill"
          ? "shadow-[inset_2px_0_0_var(--theme-ok)]"
          : "shadow-[inset_2px_0_0_var(--theme-info)]",
      )}
    >
      {/* Title row */}
      <div className="flex items-center gap-[6px] mb-[4px]">
        <span className="section-heading">{title}</span>
        <Badge intent="neutral" size="xs">
          {hz}
        </Badge>
      </div>
      {/* Trace chips */}
      <div className="flex flex-wrap gap-[6px]">
        {chips.map((c) => (
          <div key={c.name} className="flex items-center gap-[4px]">
            <TraceColor trace={c.trace} type="dot" />
            <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim) uppercase">
              {c.name}
            </span>
            <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted)">
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Depth ruler ───────────────────────────────────────────── */
function DepthRuler({ mode }: { mode: "depth" | "time" }) {
  return (
    <div
      className={cn(
        "w-[52px] flex-shrink-0 flex flex-col",
        "border-r border-(--theme-border)",
        "bg-(--theme-base)",
      )}
    >
      {/* Header */}
      <div className="px-[6px] py-[5px] border-b border-(--theme-border) flex flex-col gap-[1px]">
        <span className="section-heading">
          {mode === "depth" ? "Depth" : "Time"}
        </span>
        <span className="label-mono">{mode === "depth" ? "ft MD" : "UTC"}</span>
      </div>
      {/* Scale */}
      <div className="relative flex-1 overflow-hidden">
        {DEPTH_TICKS.map((tick) => (
          <div
            key={tick.depth}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${tick.pct}%` }}
          >
            <div
              className={cn(
                "h-px bg-(--theme-border)",
                tick.major ? "w-[10px]" : "w-[5px]",
              )}
            />
            {tick.major && (
              <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim) ml-[2px] tabular-nums">
                {tick.depth}
              </span>
            )}
          </div>
        ))}
        {/* Current depth cursor */}
        <div
          className="absolute left-0 right-0 h-px bg-(--theme-accent) opacity-60"
          style={{ top: "62%" }}
        >
          <div className="absolute left-[10px] -top-[8px]">
            <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-accent) bg-(--theme-base) px-[2px]">
              ▶
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Single log track ──────────────────────────────────────── */
function LogTrack({
  title,
  hz,
  stream,
  axisMin,
  axisMax,
  chips,
  chartTraces,
  annotation,
}: {
  title: string;
  hz: string;
  stream: "drill" | "geo";
  axisMin: string;
  axisMax: string;
  chips: Array<{
    trace: React.ComponentProps<typeof TraceColor>["trace"];
    name: string;
    value: string;
  }>;
  chartTraces: Array<{ color: string; points: string; opacity?: number }>;
  annotation?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-[120px]",
        "border-r border-(--theme-border) last:border-r-0",
        "bg-(--theme-base) overflow-hidden",
      )}
    >
      <TrackHeader title={title} hz={hz} stream={stream} chips={chips} />

      {/* Chart body */}
      <div className="relative flex-1 overflow-hidden">
        <ChartPlaceholder traces={chartTraces} />

        {/* Axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[4px] pb-[3px] pointer-events-none">
          <span className="font-['Share_Tech_Mono',monospace] text-[7px] text-(--theme-fg-dim)">
            {axisMin}
          </span>
          <span className="font-['Share_Tech_Mono',monospace] text-[7px] text-(--theme-fg-dim)">
            {axisMax}
          </span>
        </div>

        {/* Annotation marker */}
        {annotation && (
          <div
            className="absolute left-[4px] right-[4px]"
            style={{ top: "30%" }}
          >
            <div className="h-px bg-(--theme-warning) opacity-50" />
            <span
              className={cn(
                "absolute left-0 top-[2px]",
                "font-['Barlow_Condensed',sans-serif] text-[8px]",
                "text-(--theme-warning) bg-(--theme-base)",
                "px-[4px] py-[1px] rounded-[2px]",
                "border border-(--theme-warning) opacity-75",
              )}
            >
              {annotation}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Add Note input ────────────────────────────────────────── */
function AddNoteInput() {
  const [note, setNote] = useState("");
  return (
    <div className="px-[14px] py-[10px] border-t border-(--theme-border) flex-shrink-0">
      <span className="section-heading block mb-[6px]">Add Note</span>
      <div
        className={cn(
          "flex items-center gap-[6px]",
          "bg-(--theme-elevated) border border-(--theme-border)",
          "rounded-(--radius-badge)",
          "focus-within:border-(--theme-accent)",
          "focus-within:shadow-[0_0_0_3px_var(--theme-accent-dim)]",
          "transition-all duration-150",
        )}
      >
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Type a note at current depth…"
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "font-['Barlow',sans-serif] text-[12px] text-(--theme-fg)",
            "placeholder:text-(--theme-fg-dim) placeholder:font-light",
            "py-[7px] px-[10px]",
          )}
        />
        <button
          type="button"
          className={cn(
            "px-[10px] py-[7px] flex-shrink-0",
            "font-['Share_Tech_Mono',monospace] text-[12px]",
            "text-(--theme-accent)",
            "hover:text-(--theme-fg) transition-colors duration-120",
            "border-l border-(--theme-border)",
          )}
          onClick={() => setNote("")}
        >
          ↵
        </button>
      </div>
    </div>
  );
}

/* ─── ACK Modal ─────────────────────────────────────────────── */
function AckModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Surface
        elevation="elevated"
        outline="all"
        className="w-[400px] animate-fade-up shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-b border-(--theme-border)">
          <span className="text-(--theme-critical) text-[16px]">⚠</span>
          <span className="font-['Barlow_Condensed',sans-serif] text-[14px] font-bold uppercase tracking-[0.08em] flex-1">
            Acknowledge Alarm
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-(--theme-fg-dim) hover:text-(--theme-fg) transition-colors text-[14px]"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="px-[20px] py-[16px] flex flex-col gap-[14px]">
          {/* Alarm info */}
          <div
            className={cn(
              "px-[12px] py-[10px] rounded-(--radius-badge)",
              "bg-[color-mix(in_srgb,var(--theme-critical)_8%,transparent)]",
              "border border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
            )}
          >
            <p className="font-['Barlow_Condensed',sans-serif] text-[13px] font-bold text-(--theme-critical) uppercase tracking-[0.04em]">
              CRITICAL — High Gas
            </p>
            <p className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted) mt-[2px]">
              Gas Total = 42.3% · Raised at 14:31:52
            </p>
          </div>

          {/* Operator Name */}
          <div>
            <label className="field-label">Operator Name</label>
            <input
              type="text"
              placeholder="Enter your name…"
              className={cn("field-input", "font-['Barlow',sans-serif]")}
            />
          </div>

          {/* Role */}
          <div>
            <label className="field-label">Role</label>
            <input
              type="text"
              defaultValue="Driller"
              readOnly
              className={cn(
                "field-input opacity-60 cursor-not-allowed",
                "font-['Barlow',sans-serif]",
              )}
            />
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-[8px] px-[20px] py-[14px] border-t border-(--theme-border)">
          <Button intent="ghost" size="md" onClick={onClose}>
            Cancel (Esc)
          </Button>
          <Button intent="primary" size="md" onClick={onClose}>
            Confirm ACK
          </Button>
        </div>
      </Surface>
    </div>
  );
}

/* ─── Theme Switcher ────────────────────────────────────────── */
const THEMES = [
  { value: "gruvbox", label: "GBX", swatch: "#83a598" },
  { value: "tomorrow", label: "TNE", swatch: "#66cccc" },
  { value: "solarized", label: "SOL", swatch: "#2aa198" },
] as const;

function ThemeSwitcher() {
  const [active, setActive] = useState<string>("gruvbox");

  const handleChange = (theme: string) => {
    setActive(theme);
    document.documentElement.dataset.theme = theme;
  };

  return (
    <div className="theme-radio-group">
      {THEMES.map((t) => (
        <label
          key={t.value}
          className="theme-radio-label"
          data-swatch={t.value}
        >
          <input
            type="radio"
            name="theme"
            value={t.value}
            checked={active === t.value}
            onChange={() => handleChange(t.value)}
          />
          <span className="theme-radio-swatch">{t.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const time = useClock();
  const [depthMode, setDepthMode] = useState("depth");
  const [drillChecked, setDrillChecked] = useState(true);
  const [geoChecked, setGeoChecked] = useState(true);
  const [filterCrit, setFilterCrit] = useState(true);
  const [filterWarn, setFilterWarn] = useState(true);
  const [filterInfo, setFilterInfo] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [traceVisible, setTraceVisible] = useState<Record<string, boolean>>({
    rpm: true,
    wob: true,
    torque: true,
    spp: true,
    hkld: true,
    gamma: true,
    rop: true,
    gas: true,
    inc: true,
    azi: true,
  });

  const toggleTrace = (name: string) =>
    setTraceVisible((prev) => ({ ...prev, [name]: !prev[name] }));

  /* Escape closes modal */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* ── Screen guard ── */}
      <div className="screen-guard">
        <span className="text-[34px] opacity-40">🖥</span>
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-accent) px-[12px] py-[3px] border border-(--theme-accent) opacity-60 rounded-(--radius-badge)">
          Min. 1024 × 768 px
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════
          APP SHELL — grid: topbar · [main] · footer
          ════════════════════════════════════════════════════ */}
      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{
          gridTemplateRows: "44px 1fr 28px",
          gridTemplateColumns: "1fr",
        }}
      >
        {/* ── TOPBAR ──────────────────────────────────────────── */}
        <header
          className={cn(
            "flex items-center px-[12px] gap-0",
            "bg-(--theme-elevated) border-b border-(--theme-border)",
            "z-50",
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-[8px] pr-[14px] border-r border-(--theme-border) mr-[14px] flex-shrink-0">
            <div
              className={cn(
                "w-[22px] h-[22px] rounded-[3px]",
                "bg-(--theme-ok) flex items-center justify-center",
                "font-['Share_Tech_Mono',monospace] text-[10px] font-bold text-(--theme-base)",
              )}
            >
              R
            </div>
            <span className="brand-title text-[13px]">RTDC</span>
          </div>

          {/* Well name */}
          <div className="flex flex-col mr-[20px] flex-shrink-0">
            <span className="label-mono">Active Well</span>
            <span className="font-['Barlow_Condensed',sans-serif] text-[13px] font-semibold text-(--theme-fg)">
              Alpha-1 · Block 7G
            </span>
          </div>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-[4px] mr-[16px]">
            <BreadcrumbItem type="link">Wells</BreadcrumbItem>
            <BreadcrumbItem type="separator">›</BreadcrumbItem>
            <BreadcrumbItem type="link">Alpha-1</BreadcrumbItem>
            <BreadcrumbItem type="separator">›</BreadcrumbItem>
            <BreadcrumbItem type="current">Dashboard</BreadcrumbItem>
          </div>

          {/* Activity chip */}
          <div
            className={cn(
              "flex items-center gap-[6px] px-[10px] py-[4px]",
              "bg-(--theme-overlay) border border-(--theme-border)",
              "rounded-(--radius-badge) mr-[14px] flex-shrink-0",
            )}
          >
            <StatusDot status="ok" size="sm" glow pulse />
            <span className="label-mono text-(--theme-fg-muted)">Status</span>
            <span
              className={cn(
                "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold",
                "uppercase tracking-[0.06em] text-(--theme-ok)",
              )}
            >
              DRILLING
            </span>
          </div>

          <div className="flex-1" />

          {/* Theme switcher */}
          <div className="hidden xl:flex items-center mr-[14px]">
            <ThemeSwitcher />
          </div>

          {/* Live clock */}
          <div className="flex flex-col items-center mx-[16px] flex-shrink-0">
            <ValueReadout value={time} size="lg" />
            <span className="label-mono">UTC+7</span>
          </div>

          {/* Depth divider */}
          <div className="divider-v h-[28px] mx-[8px]" />

          {/* Live depth */}
          <div className="flex flex-col items-center px-[14px] border-l border-(--theme-border) flex-shrink-0">
            <ValueReadout value="12,563" unit="ft MD" size="md" status="info" />
            <span className="label-mono">Live Depth</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-[3px] pl-[12px] border-l border-(--theme-border) ml-[8px]">
            <TopbarButton
              intent="alarm"
              badgeCount={2}
              title="Active Alarms"
              onClick={() => setShowModal(true)}
            >
              ⚠
            </TopbarButton>
            <TopbarButton title="Settings">⚙</TopbarButton>
            <TopbarButton title="Export data">↓</TopbarButton>
            <TopbarButton title="User profile">◉</TopbarButton>
          </div>
        </header>

        {/* ── MAIN (left ctrl · workspace · sidebar) ──────────── */}
        <main className="flex overflow-hidden">
          {/* ── LEFT CONTROL PANEL (200px) ──────────────────── */}
          <aside
            className={cn(
              "flex flex-col overflow-hidden flex-shrink-0",
              "bg-(--theme-surface) border-r border-(--theme-border)",
            )}
            style={{ width: 200 }}
          >
            {/* Preset selector */}
            <div className="border-b border-(--theme-border) p-[10px]">
              <span className="section-heading block mb-[7px]">
                View Preset
              </span>
              <PresetSelect
                options={
                  PRESET_OPTIONS as unknown as Array<{
                    value: string;
                    label: string;
                  }>
                }
                defaultValue="full-drill"
              />
            </div>

            {/* Mode toggle — Time / Depth */}
            <div className="border-b border-(--theme-border) p-[10px]">
              <span className="section-heading block mb-[7px]">Mode</span>
              <ToggleGroup
                value={depthMode}
                onValueChange={(v) => v && setDepthMode(v)}
                className="w-full"
              >
                <ToggleItem value="time" className="flex-1">
                  Time
                </ToggleItem>
                <ToggleItem value="depth" className="flex-1">
                  Depth
                </ToggleItem>
              </ToggleGroup>
            </div>

            {/* Stream subscriptions */}
            <div className="border-b border-(--theme-border)">
              <div className="px-[10px] pt-[10px] pb-[6px]">
                <span className="section-heading">Streams</span>
              </div>
              <StreamItem
                label="DRILL"
                hz="10 Hz"
                status="active"
                selected={drillChecked}
                checked={drillChecked}
                onCheckedChange={(v) => setDrillChecked(Boolean(v))}
              />
              <StreamItem
                label="GEO"
                hz="1 Hz"
                status="active"
                selected={geoChecked}
                checked={geoChecked}
                onCheckedChange={(v) => setGeoChecked(Boolean(v))}
              />
            </div>

            {/* Drill trace list */}
            <div className="border-b border-(--theme-border) flex flex-col min-h-0">
              <div className="px-[10px] pt-[8px] pb-[4px] flex items-center gap-[6px]">
                <TraceColor trace="rpm" type="dot" />
                <span className="section-heading">Drill Traces</span>
              </div>
              <div className="overflow-y-auto scrollbar-thin flex-1">
                {DRILL_TRACES.map((t) => (
                  <TraceItem
                    key={t.name}
                    trace={t.trace}
                    name={t.name}
                    value={t.value}
                    unit={t.unit}
                    active={traceVisible[t.trace]}
                    onToggle={() => toggleTrace(t.trace)}
                  />
                ))}
              </div>
            </div>

            {/* Geo trace list */}
            <div className="flex flex-col min-h-0 flex-1">
              <div className="px-[10px] pt-[8px] pb-[4px] flex items-center gap-[6px]">
                <TraceColor trace="gamma" type="dot" />
                <span className="section-heading">Geo Traces</span>
              </div>
              <div className="overflow-y-auto scrollbar-thin flex-1">
                {GEO_TRACES.map((t) => (
                  <TraceItem
                    key={t.name}
                    trace={t.trace}
                    name={t.name}
                    value={t.value}
                    unit={t.unit}
                    active={traceVisible[t.trace]}
                    onToggle={() => toggleTrace(t.trace)}
                  />
                ))}
              </div>

              {/* Annotate button */}
              <div className="p-[10px] border-t border-(--theme-border) flex-shrink-0">
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-[6px] px-[8px] py-[6px]",
                    "bg-(--theme-elevated) border border-(--theme-border)",
                    "rounded-(--radius-badge)",
                    "font-['Barlow_Condensed',sans-serif] text-[11px] font-medium",
                    "text-(--theme-fg-muted)",
                    "hover:border-(--theme-info) hover:text-(--theme-info)",
                    "transition-colors duration-150",
                  )}
                >
                  <span>✎</span>
                  <span>Annotate Mode</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── WORKSPACE CENTER ─────────────────────────────── */}
          <section className="flex flex-col flex-1 overflow-hidden bg-(--theme-base)">
            {/* Metric strip — gauge cards */}
            <div
              className={cn(
                "flex-shrink-0 flex items-stretch overflow-x-auto scrollbar-thin",
                "bg-(--theme-surface) border-b border-(--theme-border)",
              )}
              style={{ height: 90 }}
            >
              {/* DRILL gauges */}
              {GAUGE_DRILL.map((g) => (
                <GaugeCard
                  key={g.label}
                  label={g.label}
                  value={g.value}
                  unit={g.unit}
                  status={g.status}
                  stream={g.stream}
                  min={g.min}
                  max={g.max}
                  className="flex-1 min-w-[80px] border-r border-(--theme-border) last-of-type:border-r-0"
                />
              ))}

              {/* Separator DRILL / GEO */}
              <div className="w-px bg-(--theme-border) flex-shrink-0 self-stretch" />
              <div className="flex-shrink-0 flex flex-col items-center justify-center px-[6px]">
                <span
                  className="label-mono"
                  style={{ writingMode: "vertical-rl" }}
                >
                  GEO
                </span>
              </div>
              <div className="w-px bg-(--theme-border) flex-shrink-0 self-stretch" />

              {/* GEO gauges */}
              {GAUGE_GEO.map((g) => (
                <GaugeCard
                  key={g.label}
                  label={g.label}
                  value={g.value}
                  unit={g.unit}
                  status={g.status}
                  stream={g.stream}
                  min={g.min}
                  max={g.max}
                  className="flex-1 min-w-[80px] border-r border-(--theme-border) last:border-r-0"
                />
              ))}
            </div>

            {/* Track area */}
            <div className="flex flex-1 overflow-hidden">
              <DepthRuler mode={depthMode as "depth" | "time"} />

              {/* Log tracks */}
              <div className="flex flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin">
                <LogTrack
                  title="DRILL"
                  hz="10 Hz"
                  stream="drill"
                  axisMin="0"
                  axisMax="200 rpm"
                  chips={[
                    { trace: "rpm", name: "RPM", value: "120.4" },
                    { trace: "wob", name: "WOB", value: "20.1" },
                    { trace: "torque", name: "TRQ", value: "4.87" },
                  ]}
                  chartTraces={[
                    {
                      color: "var(--trace-rpm)",
                      opacity: 0.85,
                      points:
                        "50,10 52,15 48,20 54,28 46,35 53,45 47,52 55,60 44,68 56,75 45,82 57,90 43,98 58,107 42,115 60,122 40,130 62,138 38,145 63,153 37,162 64,170 36,178 65,186 35,193 66,200",
                    },
                    {
                      color: "var(--trace-wob)",
                      opacity: 0.75,
                      points:
                        "55,8 58,18 53,28 60,38 50,48 62,57 49,67 63,76 47,86 65,95 45,105 67,114 43,124 69,133 41,143 71,152 39,162 73,171 37,181 75,190 35,200",
                    },
                    {
                      color: "var(--trace-torque)",
                      opacity: 0.65,
                      points:
                        "60,5 62,20 59,35 63,50 57,65 65,80 55,95 67,110 53,125 69,140 51,155 71,170 49,185 73,200",
                    },
                  ]}
                  annotation="Pipe change · 14:18"
                />

                <LogTrack
                  title="HYDRAULICS"
                  hz="10 Hz"
                  stream="drill"
                  axisMin="0"
                  axisMax="3000 psi"
                  chips={[
                    { trace: "spp", name: "SPP", value: "2497" },
                    { trace: "hkld", name: "HKLD", value: "201.3" },
                  ]}
                  chartTraces={[
                    {
                      color: "var(--trace-spp)",
                      opacity: 0.85,
                      points:
                        "50,12 51,22 49,32 52,42 48,52 51,62 49,72 52,82 48,92 53,102 47,112 54,122 46,132 55,142 45,152 56,162 44,172 57,182 43,192 58,200",
                    },
                    {
                      color: "var(--trace-hkld)",
                      opacity: 0.75,
                      points:
                        "70,5 68,25 72,45 66,65 74,85 64,105 76,125 62,145 78,165 60,185 80,200",
                    },
                  ]}
                />

                <LogTrack
                  title="GEO"
                  hz="1 Hz"
                  stream="geo"
                  axisMin="0 gAPI"
                  axisMax="150"
                  chips={[
                    { trace: "gamma", name: "GR", value: "52.1" },
                    { trace: "rop", name: "ROP", value: "24.8" },
                    { trace: "gas", name: "GAS", value: "8.2%" },
                  ]}
                  chartTraces={[
                    {
                      color: "var(--trace-gamma)",
                      opacity: 0.9,
                      points:
                        "45,0 45,30 80,30 80,70 30,70 30,110 75,110 75,140 20,140 20,170 65,170 65,200",
                    },
                    {
                      color: "var(--trace-rop)",
                      opacity: 0.75,
                      points:
                        "55,5 58,30 52,55 60,80 48,105 62,130 46,155 64,180 44,200",
                    },
                    {
                      color: "var(--trace-gas)",
                      opacity: 0.85,
                      points:
                        "85,10 84,40 86,70 83,95 87,110 20,120 85,130 84,160 86,190 85,200",
                    },
                  ]}
                />

                <LogTrack
                  title="DIRECTIONAL"
                  hz="1 Hz"
                  stream="geo"
                  axisMin="0°"
                  axisMax="90°"
                  chips={[
                    { trace: "inc", name: "INC", value: "3.4°" },
                    { trace: "azi", name: "AZI", value: "142°" },
                  ]}
                  chartTraces={[
                    {
                      color: "var(--trace-inc)",
                      opacity: 0.85,
                      points:
                        "50,5 51,25 51,50 52,75 52,100 53,125 53,150 54,175 55,200",
                    },
                    {
                      color: "var(--trace-azi)",
                      opacity: 0.75,
                      points:
                        "60,5 61,30 60,55 62,80 61,105 63,130 62,155 64,180 63,200",
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* ── RIGHT SIDEBAR (alarm feed, 300px) ───────────── */}
          <aside
            className={cn(
              "flex flex-col overflow-hidden flex-shrink-0",
              "bg-(--theme-base) border-l border-(--theme-border)",
            )}
            style={{ width: 300 }}
          >
            {/* Critical sticky banner */}
            <CriticalBanner
              title="High Gas Detected"
              subtitle="Gas = 42.3% · Requires immediate ACK"
            />

            {/* Header with filters */}
            <div
              className={cn(
                "flex items-center gap-[6px] px-[14px] py-[8px]",
                "border-b border-(--theme-border) flex-shrink-0",
              )}
            >
              <span className="section-heading flex-1">Alarm & Notes</span>
              <FilterChip
                intent="critical"
                active={filterCrit}
                onClick={() => setFilterCrit((p) => !p)}
              >
                CRIT
              </FilterChip>
              <FilterChip
                intent="warning"
                active={filterWarn}
                onClick={() => setFilterWarn((p) => !p)}
              >
                WARN
              </FilterChip>
              <FilterChip
                intent="info"
                active={filterInfo}
                onClick={() => setFilterInfo((p) => !p)}
              >
                INFO
              </FilterChip>
              <button
                type="button"
                className="text-(--theme-fg-dim) hover:text-(--theme-fg) text-[12px] ml-[2px] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {FEED_ITEMS.map((item, i) => (
                <FeedItem
                  key={i}
                  severity={item.severity}
                  state={item.state}
                  message={item.message}
                  meta={item.meta}
                  timestamp={item.timestamp}
                  onAck={() => setShowModal(true)}
                  onDetails={() => {}}
                />
              ))}
            </div>

            {/* Add note */}
            <AddNoteInput />
          </aside>
        </main>

        {/* ── FOOTER STATUS BAR ───────────────────────────────── */}
        <footer
          className={cn(
            "flex items-center px-[14px]",
            "bg-(--theme-base) border-t border-(--theme-border)",
            "overflow-hidden",
          )}
        >
          {/* Left: version stamp */}
          <span
            className={cn(
              "font-['Share_Tech_Mono',monospace] text-[9px]",
              "text-(--theme-fg-dim) tracking-[0.06em] mr-[16px]",
            )}
          >
            RTDC v0.1.0-alpha · Alpha-1 · © 2025
          </span>

          {/* Ticker — scrolling alarm summary */}
          <div className="ticker-strip flex-1 relative overflow-hidden">
            <div className="animate-ticker inline-flex gap-[2rem] whitespace-nowrap">
              <span className="text-(--theme-critical)">
                ⚠ CRITICAL: High Gas 42.3%
              </span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span className="text-(--theme-warning)">
                ▲ WARNING: SPP drop 2,450 psi
              </span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>Depth: 12,563 ft MD</span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>ROP: 24.8 ft/hr</span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>Block 7G · Alpha-1</span>
              {/* Duplicate for seamless loop */}
              <span className="text-(--theme-critical)">
                ⚠ CRITICAL: High Gas 42.3%
              </span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span className="text-(--theme-warning)">
                ▲ WARNING: SPP drop 2,450 psi
              </span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>Depth: 12,563 ft MD</span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>ROP: 24.8 ft/hr</span>
              <span className="text-(--theme-fg-dim)">·</span>
              <span>Block 7G · Alpha-1</span>
            </div>
          </div>

          {/* Right: stats + connection */}
          <div className="flex items-center gap-[12px] ml-[16px]">
            <FooterStat value="48 ms" label="Ping" />
            <FooterStat value="0 frames" label="Dropped" />
            <FooterStat value="—" label="Retry" />
            <div className="divider-v h-[14px]" />
            <ConnectionStatus status="online" />
          </div>
        </footer>
      </div>

      {/* ── ACK Modal (portal-like overlay) ─────────────────── */}
      {showModal && <AckModal onClose={() => setShowModal(false)} />}

      {/* ── CSS vars for trace colors (consumed by inline SVG) ── */}
      <style>{`
        :root {
          --trace-depth:  #d3869b;
          --trace-rpm:    #8ec07c;
          --trace-wob:    #fabd2f;
          --trace-torque: #fe8019;
          --trace-spp:    #83a598;
          --trace-hkld:   #d65d0e;
          --trace-gamma:  #b8bb26;
          --trace-rop:    #458588;
          --trace-gas:    #fb4934;
          --trace-inc:    #d3869b;
          --trace-azi:    #8ec07c;
        }
      `}</style>
    </>
  );
}
