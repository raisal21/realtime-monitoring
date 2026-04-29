import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Imports from core
import { TraceColor, type TraceColorProps } from "@/components/core";

/* ============================================================================
   2. TELEMETRY DATA DISPLAY
   ============================================================================ */

// ─── 2.1 VALUE READOUT ────────────────────────────────────────────────
const valueReadoutVariants = cva(
  "font-['Share_Tech_Mono',monospace] leading-none font-variant-numeric tabular-nums",
  {
    variants: {
      size: {
        xs: "text-fs-11",
        sm: "text-fs-14",
        md: "text-fs-18",
        lg: "text-fs-24",
        xl: "text-fs-28",
        "2xl": "text-fs-36",
      },
      status: {
        ok: "text-(--theme-ok)",
        warning: "text-(--theme-warning)",
        critical: "text-(--theme-critical)",
        info: "text-(--theme-info)",
        inactive: "text-(--theme-fg-dim)",
        idle: "text-(--theme-fg-dim)",
        default: "text-(--theme-fg)",
      },
    },
    defaultVariants: { size: "md", status: "default" },
  },
);

const UNIT_SIZE: Record<string, string> = {
  "2xl": "text-fs-13",
  xl: "text-fs-11",
  lg: "text-fs-10",
  md: "text-fs-9",
  sm: "text-fs-8",
  xs: "text-fs-8",
};

export interface ValueReadoutProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof valueReadoutVariants> {
  value: string | number;
  unit?: string;
  unitClassName?: string;
}

export const ValueReadout = ({
  value,
  unit,
  size = "md",
  status,
  className,
  unitClassName,
  ...props
}: ValueReadoutProps) => (
  <span className="inline-flex items-baseline gap-1" {...props}>
    <span className={cn(valueReadoutVariants({ size, status }), className)}>
      {value}
    </span>
    {unit && (
      <span
        className={cn(
          "font-['Share_Tech_Mono',monospace] text-(--theme-fg-dim) lowercase",
          UNIT_SIZE[size ?? "md"],
          unitClassName,
        )}
      >
        {unit}
      </span>
    )}
  </span>
);

// ─── 2.2 GAUGE CARD ───────────────────────────────────────────────────
const gaugeCardVariants = cva(
  [
    "relative flex flex-col gap-[2px]",
    "px-[10px] py-[8px] min-w-[80px]",
    "border border-(--theme-border) border-b-2",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      status: {
        ok: ["bg-(--theme-surface)", "border-b-(--theme-ok)"].join(" "),
        warning: [
          "bg-[color-mix(in_srgb,var(--theme-warning)_4%,var(--theme-surface))]",
          "border-b-(--theme-warning)",
        ].join(" "),
        critical: [
          "bg-[color-mix(in_srgb,var(--theme-critical)_6%,var(--theme-surface))]",
          "border-b-(--theme-critical)",
        ].join(" "),
        idle: [
          "bg-(--theme-surface) opacity-50",
          "border-b-(--theme-border)",
        ].join(" "),
      },
      stream: {
        drill: "shadow-[inset_2px_0_0_var(--theme-ok)]",
        geo: "shadow-[inset_2px_0_0_var(--theme-info)]",
        sys: "shadow-[inset_2px_0_0_var(--theme-fg-dim)]",
      },
    },
    compoundVariants: [
      {
        status: "critical",
        class: "animate-[gauge-critical-pulse_2.2s_ease-in-out_infinite]",
      },
    ],
    defaultVariants: { status: "ok", stream: "drill" },
  },
);

export interface GaugeCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gaugeCardVariants> {
  label: string;
  value: string | number;
  unit?: string;
  min?: number;
  max?: number;
}

export const GaugeCard = ({
  label,
  value,
  unit,
  status,
  stream,
  min,
  max,
  className,
  ...props
}: GaugeCardProps) => {
  const fillPct =
    min !== undefined && max !== undefined
      ? Math.min(100, Math.max(0, ((Number(value) - min) / (max - min)) * 100))
      : null;

  return (
    <div
      className={cn(gaugeCardVariants({ status, stream }), className)}
      {...props}
    >
      <span className="label-mono">{label}</span>
      <ValueReadout
        value={value}
        unit={unit}
        size="xl"
        status={status ?? "default"}
      />
      {fillPct !== null && (
        <div className="mt-1 h-0.5 w-full rounded-full overflow-hidden bg-(--theme-border-subtle)">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              status === "critical"
                ? "bg-(--theme-critical)"
                : status === "warning"
                  ? "bg-(--theme-warning)"
                  : "bg-(--theme-ok)",
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── 2.3 TRACE ITEM ───────────────────────────────────────────────────
const traceItemVariants = cva(
  [
    "flex items-center gap-[8px] px-[12px] py-[6px] cursor-pointer",
    "font-['Barlow_Condensed',sans-serif] text-fs-11 font-semibold tracking-[0.04em] uppercase",
    "transition-all duration-120",
    "hover:bg-[color-mix(in_srgb,var(--theme-elevated)_60%,transparent)]",
  ].join(" "),
  {
    variants: {
      active: {
        true: "text-(--theme-fg) opacity-100",
        false: "text-(--theme-fg-dim) opacity-45",
      },
    },
    defaultVariants: { active: true },
  },
);

export interface TraceItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  trace: TraceColorProps["trace"];
  name: string;
  value: string | number;
  unit?: string;
  active?: boolean;
  onToggle?: () => void;
}

export const TraceItem = ({
  trace,
  name,
  value,
  unit,
  active = true,
  onToggle,
  className,
  ...props
}: TraceItemProps) => (
  <div className={cn(traceItemVariants({ active }), className)} {...props}>
    <TraceColor trace={trace} type="line" />
    <span className="flex-1 min-w-0 truncate">{name}</span>
    <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-muted) tabular-nums">
      {value}
      {unit && <span className="text-(--theme-fg-dim) ml-0.5">{unit}</span>}
    </span>
    <TraceToggle
      on={active}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
    />
  </div>
);

// ─── 2.4 TRACE TOGGLE ─────────────────────────────────────────────────
const traceToggleVariants = cva(
  [
    "flex items-center justify-center shrink-0",
    "w-[16px] h-[16px] rounded-xs border",
    "text-fs-9 font-bold cursor-pointer",
    "transition-all duration-120",
  ].join(" "),
  {
    variants: {
      on: {
        true: [
          "bg-(--theme-accent-dim) border-(--theme-accent)",
          "text-(--theme-accent)",
        ].join(" "),
        false: [
          "bg-transparent border-(--theme-border)",
          "text-(--theme-fg-dim)",
        ].join(" "),
      },
    },
    defaultVariants: { on: true },
  },
);

export interface TraceToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
}

export const TraceToggle = ({
  on = true,
  className,
  ...props
}: TraceToggleProps) => (
  <button
    type="button"
    className={cn(traceToggleVariants({ on }), className)}
    aria-label={on ? "Hide trace" : "Show trace"}
    aria-pressed={on}
    {...props}
  >
    {on ? (
      <Check size={9} strokeWidth={2.5} />
    ) : (
      <Minus size={9} strokeWidth={2.5} />
    )}
  </button>
);

// ─── 8.8 GAUGE CARD COMPACT ───────────────────────────────────────────
const gaugeCardCompactVariants = cva(
  [
    "relative flex flex-col gap-px px-2 py-1.5",
    "border-l-2 transition-all duration-200",
    "border-y border-r border-y-(--theme-border) border-r-(--theme-border)",
  ].join(" "),
  {
    variants: {
      status: {
        ok: "bg-(--theme-surface) border-l-(--theme-ok)",
        warning: [
          "bg-[color-mix(in_srgb,var(--theme-warning)_4%,var(--theme-surface))]",
          "border-l-(--theme-warning)",
        ].join(" "),
        critical: [
          "bg-[color-mix(in_srgb,var(--theme-critical)_6%,var(--theme-surface))]",
          "border-l-(--theme-critical)",
          "animate-[gauge-critical-pulse_2.2s_ease-in-out_infinite]",
        ].join(" "),
        idle: [
          "bg-(--theme-surface) opacity-50",
          "border-l-(--theme-border)",
        ].join(" "),
      },
    },
    defaultVariants: { status: "ok" },
  },
);

export interface GaugeCardCompactProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gaugeCardCompactVariants> {
  label: string;
  value: string | number;
  unit?: string;
}

export const GaugeCardCompact = ({
  label,
  value,
  unit,
  status,
  className,
  ...props
}: GaugeCardCompactProps) => {
  const valueStatus =
    status === "warning"
      ? "warning"
      : status === "critical"
        ? "critical"
        : status === "idle"
          ? "inactive"
          : "default";

  return (
    <div
      className={cn(gaugeCardCompactVariants({ status }), className)}
      {...props}
    >
      <span className="label-mono">{label}</span>
      <ValueReadout value={value} unit={unit} size="md" status={valueStatus} />
    </div>
  );
};
