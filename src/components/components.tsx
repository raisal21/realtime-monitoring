/* ============================================================================
   RTDC — Component Library (v2 + polishing)
   Base UI primitives · CVA variants · Tailwind v4 · lucide-react icons
   ============================================================================
   Sections:
   0. Imports & Utility
   1. Core Primitives    Button, Input, Surface, Badge, StatusDot,
                         ToggleGroup/Item, TraceColor
   2. Telemetry Display  ValueReadout, GaugeCard, TraceItem, TraceToggle
   3. Alarm System       FilterChip, FeedItem, CriticalBanner
   4. Navigation Shell   TopbarButton, BreadcrumbItem
   5. Well Explorer      WellListItem, WellMetric, SidebarStat
   6. Footer             ConnectionStatus, FooterStat
   7. Preset Select      PresetSelect (Base UI Select)
   8. v2 Primitives      Popover, Switch, IconButton, RadioCard,
                         LiveBadge, RangePresetButton, TrackFooterRow,
                         GaugeCardCompact
   9. Polishing v2       RailSection, Slider, PopoverHeader,
                         PopoverTitle, PopoverDescription
   ============================================================================ */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check, Minus, Diamond, ChevronDown } from "lucide-react";

// Base UI — sub-path imports for consistent tree-shaking
import { Button as BaseButton } from "@base-ui/react/button";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Slider as BaseSlider } from "@base-ui/react/slider";

/* ============================================================================
   0. UTILITY
   ============================================================================ */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ============================================================================
   1. CORE PRIMITIVES
   ============================================================================ */

// ─── 1.1 BUTTON ───────────────────────────────────────────────────────────────
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-['Barlow_Condensed',sans-serif] font-bold uppercase tracking-[0.14em]",
    "rounded-(--radius-btn)",
    "transition-all duration-150 cursor-pointer select-none",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    "focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--theme-base)]",
  ].join(" "),
  {
    variants: {
      intent: {
        primary: [
          "bg-(--theme-accent) text-[#0c0e10]",
          "hover:brightness-110",
          "hover:shadow-[0_0_24px_color-mix(in_srgb,var(--theme-accent)_40%,transparent)]",
          "active:scale-[0.98] active:brightness-95",
          "relative overflow-hidden",
        ].join(" "),

        secondary: [
          "bg-transparent",
          "border border-(--theme-border) text-(--theme-fg-muted)",
          "hover:border-(--theme-accent) hover:text-(--theme-fg)",
          "hover:bg-(--theme-elevated)",
          "active:scale-[0.98]",
        ].join(" "),

        danger: [
          "bg-[color-mix(in_srgb,var(--theme-critical)_15%,transparent)]",
          "border border-[color-mix(in_srgb,var(--theme-critical)_40%,transparent)]",
          "text-(--theme-critical)",
          "hover:bg-[color-mix(in_srgb,var(--theme-critical)_25%,transparent)]",
          "hover:border-(--theme-critical)",
          "active:scale-[0.98]",
        ].join(" "),

        ghost: [
          "bg-transparent border border-transparent text-(--theme-fg-muted)",
          "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
          "hover:border-(--theme-border)",
          "active:scale-[0.98]",
        ].join(" "),
      },

      size: {
        sm: "px-[10px] py-1 text-[10px] gap-[5px]",
        md: "px-[14px] py-[7px] text-[11px] gap-[6px]",
        lg: "px-[20px] py-2.5 text-[12px] gap-2",
        xl: "px-[34px] py-[11px] text-[12px] gap-2",
        icon: "w-[30px] h-[30px] text-[14px] p-0",
      },

      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    compoundVariants: [
      {
        intent: "primary",
        size: "xl",
        class: [
          "after:absolute after:inset-0",
          "after:bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,0.17)_50%,transparent_62%)]",
          "after:-translate-x-full",
          "after:animate-[shimmer_4s_ease-in-out_infinite_2s]",
        ].join(" "),
      },
    ],

    defaultVariants: {
      intent: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ComponentPropsWithoutRef<typeof BaseButton>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, fullWidth, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(buttonVariants({ intent, size, fullWidth }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

// ─── 1.2 INPUT ────────────────────────────────────────────────────────────────
const inputVariants = cva(
  [
    "w-full bg-transparent border-none outline-none",
    "text-(--theme-fg) font-['Barlow',sans-serif] text-[13px]",
    "placeholder:text-(--theme-fg-dim) placeholder:font-light",
    "py-2.5 pr-3",
    "letter-spacing-[0.02em]",
  ].join(" "),
  {
    variants: {
      hasIcon: {
        true: "pl-[34px]",
        false: "pl-3",
      },
    },
    defaultVariants: { hasIcon: false },
  },
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, icon, ...props }, ref) => (
    <div
      className={cn(
        "relative flex items-center w-full",
        "bg-(--theme-elevated) border border-(--theme-border)",
        "rounded-(--radius-badge) transition-all duration-150",
        "focus-within:border-(--theme-accent)",
        "focus-within:shadow-[0_0_0_3px_var(--theme-accent-dim)]",
        wrapperClassName,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-2.75 flex items-center justify-center",
            "text-[12px] text-(--theme-fg-dim) pointer-events-none",
            "group-focus-within:text-(--theme-accent) transition-colors duration-150",
          )}
        >
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(inputVariants({ hasIcon: !!icon }), className)}
        {...props}
      />
    </div>
  ),
);
Input.displayName = "Input";

// ─── 1.3 SURFACE / PANEL ──────────────────────────────────────────────────────
const surfaceVariants = cva("overflow-hidden", {
  variants: {
    elevation: {
      base: "bg-(--theme-base)",
      surface: "bg-(--theme-surface)",
      elevated: "bg-(--theme-elevated)",
      overlay: "bg-(--theme-overlay)",
      glass: [
        "bg-[color-mix(in_srgb,var(--theme-surface)_88%,transparent)]",
        "backdrop-blur-[22px] -webkit-backdrop-blur-[22px]",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.45),0_32px_80px_rgba(0,0,0,0.6),0_0_120px_var(--theme-accent-dim)]",
      ].join(" "),
    },
    outline: {
      all: "border border-(--theme-border) rounded-(--radius-panel)",
      subtle: "border border-(--theme-border-subtle) rounded-(--radius-panel)",
      bottom: "border-b border-(--theme-border)",
      right: "border-r border-(--theme-border)",
      left: "border-l border-(--theme-border)",
      none: "",
    },
  },
  compoundVariants: [
    {
      elevation: "glass",
      outline: "all",
      class: "border-(--theme-accent-dim)",
    },
  ],
  defaultVariants: { elevation: "surface", outline: "all" },
});

export interface SurfaceProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ elevation, outline, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ elevation, outline }), className)}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

// ─── 1.4 BADGE / CHIP ─────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center justify-center font-bold uppercase tracking-[0.08em] rounded-xs",
  {
    variants: {
      intent: {
        ok: [
          "bg-[color-mix(in_srgb,var(--theme-ok)_15%,transparent)]",
          "text-(--theme-ok)",
          "border border-[color-mix(in_srgb,var(--theme-ok)_30%,transparent)]",
        ].join(" "),
        warning: [
          "bg-[color-mix(in_srgb,var(--theme-warning)_12%,transparent)]",
          "text-(--theme-warning)",
          "border border-[color-mix(in_srgb,var(--theme-warning)_25%,transparent)]",
        ].join(" "),
        critical: [
          "bg-[color-mix(in_srgb,var(--theme-critical)_15%,transparent)]",
          "text-(--theme-critical)",
          "border border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
        ].join(" "),
        info: [
          "bg-[color-mix(in_srgb,var(--theme-info)_12%,transparent)]",
          "text-(--theme-info)",
          "border border-[color-mix(in_srgb,var(--theme-info)_25%,transparent)]",
        ].join(" "),
        orange: [
          "bg-[color-mix(in_srgb,var(--theme-orange)_15%,transparent)]",
          "text-(--theme-orange)",
          "border border-[color-mix(in_srgb,var(--theme-orange)_30%,transparent)]",
        ].join(" "),
        neutral: [
          "bg-(--theme-elevated) text-(--theme-fg-dim)",
          "border border-(--theme-border)",
        ].join(" "),
      },
      size: {
        xs: "px-[4px] py-[1px] text-[7px]",
        sm: "px-1 py-[1px] text-[8px]",
        md: "px-2 py-[3px] text-[9px]",
        lg: "px-2.5 py-1 text-[10px]",
      },
    },
    defaultVariants: { intent: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ intent, size, className, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ intent, size }), className)} {...props} />
);

// ─── 1.5 STATUS DOT ───────────────────────────────────────────────────────────
const statusDotVariants = cva("rounded-full shrink-0", {
  variants: {
    status: {
      ok: "bg-(--theme-ok)",
      warning: "bg-(--theme-warning)",
      critical: "bg-(--theme-critical)",
      info: "bg-(--theme-info)",
      inactive: "bg-(--theme-fg-dim)",
    },
    size: {
      sm: "w-[6px] h-[6px]",
      md: "w-[8px] h-[8px]",
      lg: "w-[12px] h-[12px]",
    },
    glow: { true: "", false: "" },
    pulse: { true: "", false: "" },
  },
  compoundVariants: [
    { status: "ok", glow: true, class: "shadow-[0_0_6px_var(--theme-ok)]" },
    {
      status: "warning",
      glow: true,
      class: "shadow-[0_0_6px_var(--theme-warning)]",
    },
    {
      status: "critical",
      glow: true,
      class: "shadow-[0_0_8px_var(--theme-critical)]",
    },
    { status: "info", glow: true, class: "shadow-[0_0_6px_var(--theme-info)]" },
    { status: "critical", pulse: true, class: "animate-pulse-critical" },
    {
      status: "ok",
      pulse: true,
      class: "animate-[dp_2s_ease-in-out_infinite]",
    },
    { status: "warning", pulse: true, class: "animate-pulse" },
  ],
  defaultVariants: {
    status: "inactive",
    size: "md",
    glow: false,
    pulse: false,
  },
});

export interface StatusDotProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusDotVariants> {}

export const StatusDot = ({
  status,
  size,
  glow,
  pulse,
  className,
  ...props
}: StatusDotProps) => (
  <div
    className={cn(statusDotVariants({ status, size, glow, pulse }), className)}
    {...props}
  />
);

// ─── 1.6 TOGGLE GROUP (Base UI) ───────────────────────────────────────────────
export const ToggleGroup = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof BaseToggleGroup>) => (
  <BaseToggleGroup
    ref={ref}
    className={cn(
      "inline-flex border border-(--theme-border)",
      "rounded-(--radius-badge) overflow-hidden",
      className,
    )}
    {...props}
  />
);

export const ToggleItem = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof BaseToggle>) => (
  <BaseToggle
    ref={ref}
    className={cn(
      "flex-1 px-3 py-1.25 cursor-pointer border-none transition-colors duration-150",
      "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold tracking-[0.06em] uppercase",
      "text-(--theme-fg-dim) bg-(--theme-elevated)",
      "hover:bg-(--theme-overlay) hover:text-(--theme-fg-muted)",
      "data-[state=on]:bg-(--theme-accent) data-[state=on]:text-[#0c0e10]",
      "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent)",
      className,
    )}
    {...props}
  />
);
// ─── 1.7 TRACE COLOR ──────────────────────────────────────────────────────────
const traceColorVariants = cva("shrink-0 rounded-(--radius-badge)", {
  variants: {
    trace: {
      depth: "bg-[#d3869b]",
      rpm: "bg-[#8ec07c]",
      wob: "bg-[#fabd2f]",
      torque: "bg-[#fe8019]",
      spp: "bg-[#83a598]",
      hkld: "bg-[#d65d0e]",
      gamma: "bg-[#b8bb26]",
      rop: "bg-[#458588]",
      gas: "bg-[#fb4934]",
      inc: "bg-[#d3869b]",
      azi: "bg-[#8ec07c]",
    },
    type: {
      line: "w-[12px] h-[3px]",
      dot: "w-[7px] h-[7px] rounded-full",
      block: "w-2.5 h-[10px]",
    },
  },
  defaultVariants: { trace: "rpm", type: "line" },
});

export interface TraceColorProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof traceColorVariants> {}

export const TraceColor = ({
  trace,
  type,
  className,
  ...props
}: TraceColorProps) => (
  <div
    className={cn(traceColorVariants({ trace, type }), className)}
    {...props}
  />
);

/* ============================================================================
   2. TELEMETRY DATA DISPLAY
   ============================================================================ */

// ─── 2.1 VALUE READOUT ────────────────────────────────────────────────────────
const valueReadoutVariants = cva(
  "font-['Share_Tech_Mono',monospace] leading-none font-variant-numeric tabular-nums",
  {
    variants: {
      size: {
        xs: "text-[11px]",
        sm: "text-[14px]",
        md: "text-[18px]",
        lg: "text-[24px]",
        xl: "text-[28px]",
        "2xl": "text-[36px]",
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
  "2xl": "text-[13px]",
  xl: "text-[11px]",
  lg: "text-[10px]",
  md: "text-[9px]",
  sm: "text-[8px]",
  xs: "text-[8px]",
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

// ─── 2.2 GAUGE CARD ───────────────────────────────────────────────────────────
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

// ─── 2.3 TRACE ITEM ───────────────────────────────────────────────────────────
const traceItemVariants = cva(
  [
    "flex items-center gap-[8px] px-[12px] py-[6px] cursor-pointer",
    "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold tracking-[0.04em] uppercase",
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
  trace: React.ComponentProps<typeof TraceColor>["trace"];
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
    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted) tabular-nums">
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

// ─── 2.4 TRACE TOGGLE ─────────────────────────────────────────────────────────
const traceToggleVariants = cva(
  [
    "flex items-center justify-center shrink-0",
    "w-[16px] h-[16px] rounded-xs border",
    "text-[9px] font-bold cursor-pointer",
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

/* ============================================================================
   3. ALARM SYSTEM
   ============================================================================ */

// ─── 3.1 FILTER CHIP ──────────────────────────────────────────────────────────
const filterChipVariants = cva(
  [
    "inline-flex items-center gap-[4px] px-[8px] py-[3px]",
    "rounded-(--radius-badge) border cursor-pointer select-none",
    "font-['Share_Tech_Mono',monospace] text-[9px] font-bold uppercase tracking-[0.1em]",
    "transition-all duration-150",
  ].join(" "),
  {
    variants: {
      intent: {
        critical: "text-(--theme-critical)",
        warning: "text-(--theme-warning)",
        info: "text-(--theme-info)",
        note: "text-(--theme-fg-muted)",
      },
      active: {
        true: "",
        false: "opacity-35 hover:opacity-60",
      },
    },
    compoundVariants: [
      {
        intent: "critical",
        active: true,
        class:
          "bg-[color-mix(in_srgb,var(--theme-critical)_15%,transparent)] border-[color-mix(in_srgb,var(--theme-critical)_40%,transparent)]",
      },
      {
        intent: "critical",
        active: false,
        class: "bg-transparent border-(--theme-border)",
      },
      {
        intent: "warning",
        active: true,
        class:
          "bg-[color-mix(in_srgb,var(--theme-warning)_12%,transparent)] border-[color-mix(in_srgb,var(--theme-warning)_35%,transparent)]",
      },
      {
        intent: "warning",
        active: false,
        class: "bg-transparent border-(--theme-border)",
      },
      {
        intent: "info",
        active: true,
        class:
          "bg-[color-mix(in_srgb,var(--theme-info)_12%,transparent)] border-[color-mix(in_srgb,var(--theme-info)_35%,transparent)]",
      },
      {
        intent: "info",
        active: false,
        class: "bg-transparent border-(--theme-border)",
      },
      {
        intent: "note",
        active: true,
        class: "bg-(--theme-elevated) border-(--theme-border)",
      },
      {
        intent: "note",
        active: false,
        class: "bg-transparent border-(--theme-border)",
      },
    ],
    defaultVariants: { intent: "info", active: true },
  },
);

export interface FilterChipProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterChipVariants> {}

export const FilterChip = ({
  intent,
  active,
  className,
  ...props
}: FilterChipProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={active ?? true}
    className={cn(filterChipVariants({ intent, active }), className)}
    {...props}
  />
);

// ─── 3.2 FEED ITEM ────────────────────────────────────────────────────────────
const feedItemVariants = cva(
  [
    "relative px-[14px] py-2.5",
    "border-b border-(--theme-border-subtle)",
    "border-l-[3px]",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      severity: {
        critical: "",
        warning: "",
        info: "",
        note: "",
      },
      state: {
        unacked: "",
        acked: "",
        resolved: "opacity-40",
      },
    },
    compoundVariants: [
      {
        severity: "critical",
        state: "unacked",
        class: [
          "border-l-(--theme-critical)",
          "bg-[color-mix(in_srgb,var(--theme-critical)_5%,var(--theme-base))]",
          "animate-[feed-critical-pulse_2.5s_ease-in-out_infinite]",
        ].join(" "),
      },
      {
        severity: "critical",
        state: "acked",
        class: "border-l-(--theme-critical) bg-(--theme-base)",
      },
      {
        severity: "critical",
        state: "resolved",
        class: "border-l-(--theme-border) bg-(--theme-base)",
      },
      {
        severity: "warning",
        state: "unacked",
        class: [
          "border-l-(--theme-warning)",
          "bg-[color-mix(in_srgb,var(--theme-warning)_4%,var(--theme-base))]",
        ].join(" "),
      },
      {
        severity: "warning",
        state: "acked",
        class: "border-l-(--theme-warning) bg-(--theme-base)",
      },
      {
        severity: "warning",
        state: "resolved",
        class: "border-l-(--theme-border) bg-(--theme-base)",
      },
      {
        severity: "info",
        state: "unacked",
        class: "border-l-(--theme-info) bg-(--theme-base)",
      },
      {
        severity: "info",
        state: "acked",
        class: "border-l-(--theme-info) bg-(--theme-base)",
      },
      {
        severity: "info",
        state: "resolved",
        class: "border-l-(--theme-border) bg-(--theme-base)",
      },
      {
        severity: "note",
        state: "unacked",
        class: "border-l-(--theme-fg-dim) bg-(--theme-base)",
      },
      {
        severity: "note",
        state: "acked",
        class: "border-l-(--theme-fg-dim) bg-(--theme-base)",
      },
      {
        severity: "note",
        state: "resolved",
        class: "border-l-(--theme-border) bg-(--theme-base)",
      },
    ],
    defaultVariants: { severity: "info", state: "unacked" },
  },
);

const SEVERITY_TO_BADGE: Record<
  NonNullable<VariantProps<typeof feedItemVariants>["severity"]>,
  VariantProps<typeof badgeVariants>["intent"]
> = {
  critical: "critical",
  warning: "warning",
  info: "info",
  note: "neutral",
};

export interface FeedItemProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof feedItemVariants> {
  message: string;
  meta?: string;
  timestamp?: string;
  onAck?: () => void;
  onDetails?: () => void;
}

export const FeedItem = ({
  severity,
  state,
  message,
  meta,
  timestamp,
  onAck,
  onDetails,
  className,
  ...props
}: FeedItemProps) => {
  const needsAck =
    state === "unacked" && (severity === "critical" || severity === "warning");

  return (
    <div
      className={cn(feedItemVariants({ severity, state }), className)}
      {...props}
    >
      <div className="flex items-center justify-between mb-1">
        <Badge intent={SEVERITY_TO_BADGE[severity ?? "info"]} size="xs">
          {(severity ?? "info").toUpperCase()}
        </Badge>
        {timestamp && (
          <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim)">
            {timestamp}
          </span>
        )}
      </div>
      <p className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg) leading-snug mb-0.75">
        {message}
      </p>
      {meta && (
        <p className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-dim)">
          {meta}
        </p>
      )}
      {needsAck && (
        <div className="flex gap-1.5 mt-2">
          <Button intent="danger" size="sm" onClick={onAck}>
            ACK
          </Button>
          <Button intent="ghost" size="sm" onClick={onDetails}>
            Details
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── 3.3 CRITICAL BANNER ──────────────────────────────────────────────────────
export interface CriticalBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

export const CriticalBanner = ({
  title,
  subtitle,
  className,
  ...props
}: CriticalBannerProps) => (
  <div
    role="alert"
    aria-live="assertive"
    className={cn(
      "flex items-start gap-2.5 px-[14px] py-2.5",
      "border-b-2 border-b-(--theme-critical)",
      "bg-[color-mix(in_srgb,var(--theme-critical)_12%,var(--theme-base))]",
      "animate-[feed-critical-pulse_2.5s_ease-in-out_infinite]",
      className,
    )}
    {...props}
  >
    <span
      className="text-(--theme-critical) text-[14px] leading-none mt-px shrink-0"
      aria-hidden="true"
    >
      ⚠
    </span>
    <div className="flex flex-col gap-px">
      <span className="font-['Barlow_Condensed',sans-serif] text-[12px] font-bold uppercase tracking-[0.06em] text-(--theme-critical)">
        {title}
      </span>
      {subtitle && (
        <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted)">
          {subtitle}
        </span>
      )}
    </div>
  </div>
);

/* ============================================================================
   4. NAVIGATION SHELL
   ============================================================================ */

// ─── 4.1 TOPBAR BUTTON ────────────────────────────────────────────────────────
const topbarButtonVariants = cva(
  [
    "relative flex items-center justify-center",
    "w-[30px] h-[30px] rounded-(--radius-badge)",
    "border border-transparent cursor-pointer",
    "text-[14px] text-(--theme-fg-muted)",
    "transition-all duration-150",
    "hover:bg-(--theme-elevated) hover:border-(--theme-border) hover:text-(--theme-fg)",
    "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      intent: {
        default: "",
        alarm: [
          "text-(--theme-critical)",
          "border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--theme-critical)_10%,transparent)]",
          "hover:bg-[color-mix(in_srgb,var(--theme-critical)_20%,transparent)]",
          "hover:border-(--theme-critical)",
          "animate-[topbar-alarm-pulse_2s_ease-in-out_infinite]",
        ].join(" "),
      },
    },
    defaultVariants: { intent: "default" },
  },
);

export interface TopbarButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof topbarButtonVariants> {
  badgeCount?: number;
}

export const TopbarButton = ({
  intent,
  badgeCount,
  className,
  children,
  ...props
}: TopbarButtonProps) => (
  <button
    type="button"
    className={cn(topbarButtonVariants({ intent }), className)}
    {...props}
  >
    {children}
    {badgeCount !== undefined && badgeCount > 0 && (
      <span
        aria-label={`${badgeCount} unacknowledged`}
        className={cn(
          "absolute -top-1 -right-1",
          "min-w-[14px] h-[14px] px-0.5",
          "rounded-full flex items-center justify-center",
          "bg-(--theme-critical) text-white",
          "font-['Share_Tech_Mono',monospace] text-[8px] font-bold leading-none",
        )}
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </span>
    )}
  </button>
);

// ─── 4.2 BREADCRUMB ITEM ──────────────────────────────────────────────────────
const breadcrumbItemVariants = cva(
  "font-['Barlow_Condensed',sans-serif] text-[11px] transition-colors duration-150",
  {
    variants: {
      type: {
        link: "text-(--theme-fg-muted) hover:text-(--theme-accent) cursor-pointer",
        separator: "text-(--theme-fg-dim) text-[10px] select-none",
        current: "text-(--theme-fg) font-semibold cursor-default",
      },
    },
    defaultVariants: { type: "link" },
  },
);

export interface BreadcrumbItemProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof breadcrumbItemVariants> {}

export const BreadcrumbItem = ({
  type,
  className,
  ...props
}: BreadcrumbItemProps) => (
  <span
    className={cn(breadcrumbItemVariants({ type }), className)}
    aria-current={type === "current" ? "page" : undefined}
    {...props}
  />
);

/* ============================================================================
   5. WELL EXPLORER
   ============================================================================ */

// ─── 5.1 WELL LIST ITEM ───────────────────────────────────────────────────────
const wellListItemVariants = cva(
  [
    "relative flex items-start gap-[10px]",
    "px-[16px] py-[12px]",
    "border-b border-(--theme-border)",
    "border-l-[2px] border-l-transparent",
    "cursor-pointer transition-all duration-120",
  ].join(" "),
  {
    variants: {
      drillingStatus: {
        drilling: "",
        standby: "",
        offline: "opacity-55",
      },
      selected: {
        true: "bg-[color-mix(in_srgb,var(--theme-accent)_7%,transparent)]",
        false: "bg-transparent hover:bg-(--theme-elevated)",
      },
    },
    compoundVariants: [
      {
        drillingStatus: "drilling",
        selected: true,
        class: "border-l-(--theme-ok)",
      },
      {
        drillingStatus: "drilling",
        selected: false,
        class:
          "hover:border-l-[color-mix(in_srgb,var(--theme-ok)_40%,transparent)]",
      },
      {
        drillingStatus: "standby",
        selected: true,
        class: "border-l-(--theme-warning)",
      },
      {
        drillingStatus: "standby",
        selected: false,
        class: "hover:border-l-(--theme-border)",
      },
      {
        drillingStatus: "offline",
        selected: true,
        class: "border-l-(--theme-fg-dim)",
      },
    ],
    defaultVariants: { drillingStatus: "offline", selected: false },
  },
);

const DRILLING_DOT_STATUS: Record<
  NonNullable<VariantProps<typeof wellListItemVariants>["drillingStatus"]>,
  VariantProps<typeof statusDotVariants>["status"]
> = {
  drilling: "ok",
  standby: "warning",
  offline: "inactive",
};

export interface WellListItemProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof wellListItemVariants> {
  name: string;
  block?: string;
  metrics?: Array<{ key: string; value: string | number; unit?: string }>;
  onEnter?: () => void;
}

export const WellListItem = ({
  name,
  block,
  metrics,
  drillingStatus,
  selected,
  onEnter,
  className,
  ...props
}: WellListItemProps) => (
  <div
    className={cn(
      wellListItemVariants({ drillingStatus, selected }),
      className,
    )}
    aria-selected={selected ?? false}
    role="option"
    {...props}
  >
    <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
      <StatusDot
        status={DRILLING_DOT_STATUS[drillingStatus ?? "offline"]}
        size="md"
        glow={drillingStatus === "drilling"}
        pulse={drillingStatus === "drilling"}
      />
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-['Barlow_Condensed',sans-serif] text-[13px] font-bold tracking-[0.04em] truncate mb-0.5">
        {name}
      </p>
      {block && (
        <p className="text-[10px] text-(--theme-fg-muted) tracking-[0.04em] mb-1.25">
          {block}
        </p>
      )}
      {metrics && metrics.length > 0 && (
        <div className="flex gap-2.5 flex-wrap">
          {metrics.map((m) => (
            <WellMetric
              key={m.key}
              metricKey={m.key}
              value={m.value}
              unit={m.unit}
            />
          ))}
        </div>
      )}
    </div>

    <div className="shrink-0 self-center">
      {selected && onEnter ? (
        <Button
          intent="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
        >
          Enter →
        </Button>
      ) : drillingStatus === "offline" ? (
        <Badge intent="neutral" size="sm">
          Offline
        </Badge>
      ) : null}
    </div>
  </div>
);

// ─── 5.2 WELL METRIC ──────────────────────────────────────────────────────────
export interface WellMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  metricKey: string;
  value: string | number;
  unit?: string;
}

export const WellMetric = ({
  metricKey,
  value,
  unit,
  className,
  ...props
}: WellMetricProps) => (
  <div className={cn("flex flex-col gap-0", className)} {...props}>
    <span className="font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-fg) leading-none">
      {value}
      {unit && (
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim) ml-px">
          {unit}
        </span>
      )}
    </span>
    <span className="text-[8px] text-(--theme-fg-dim) uppercase tracking-[0.08em]">
      {metricKey}
    </span>
  </div>
);

// ─── 5.3 SIDEBAR STAT ─────────────────────────────────────────────────────────
const sidebarStatVariants = cva("flex flex-col gap-px", {
  variants: {
    colorScheme: {
      ok: "[&_.stat-val]:text-[var(--theme-ok)]",
      warning: "[&_.stat-val]:text-[var(--theme-warning)]",
      critical: "[&_.stat-val]:text-[var(--theme-critical)]",
      inactive: "[&_.stat-val]:text-[var(--theme-fg-dim)]",
      default: "[&_.stat-val]:text-[var(--theme-fg)]",
    },
  },
  defaultVariants: { colorScheme: "default" },
});

export interface SidebarStatProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarStatVariants> {
  value: string | number;
  label: string;
}

export const SidebarStat = ({
  value,
  label,
  colorScheme,
  className,
  ...props
}: SidebarStatProps) => (
  <div
    className={cn(sidebarStatVariants({ colorScheme }), className)}
    {...props}
  >
    <span className="stat-val font-['Share_Tech_Mono',monospace] text-[18px] leading-none">
      {value}
    </span>
    <span className="text-[9px] text-(--theme-fg-dim) uppercase tracking-[0.08em]">
      {label}
    </span>
  </div>
);

/* ============================================================================
   7. FOOTER
   ============================================================================ */

// ─── 7.1 CONNECTION STATUS ────────────────────────────────────────────────────
const connectionStatusVariants = cva(
  [
    "flex items-center gap-[5px]",
    "px-[8px] py-[3px] rounded-(--radius-badge) border",
    "font-['Share_Tech_Mono',monospace] text-[9px] uppercase tracking-[0.1em]",
    "cursor-default select-none transition-all duration-300",
  ].join(" "),
  {
    variants: {
      status: {
        online: [
          "text-(--theme-ok)",
          "bg-[color-mix(in_srgb,var(--theme-ok)_10%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-ok)_30%,transparent)]",
        ].join(" "),
        reconnecting: [
          "text-(--theme-warning)",
          "bg-[color-mix(in_srgb,var(--theme-warning)_10%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-warning)_30%,transparent)]",
          "animate-pulse",
        ].join(" "),
        offline: [
          "text-(--theme-critical)",
          "bg-[color-mix(in_srgb,var(--theme-critical)_10%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
        ].join(" "),
      },
    },
    defaultVariants: { status: "online" },
  },
);

const CONNECTION_DOT: Record<
  NonNullable<VariantProps<typeof connectionStatusVariants>["status"]>,
  VariantProps<typeof statusDotVariants>["status"]
> = {
  online: "ok",
  reconnecting: "warning",
  offline: "critical",
};

const CONNECTION_LABEL: Record<
  NonNullable<VariantProps<typeof connectionStatusVariants>["status"]>,
  string
> = {
  online: "ONLINE",
  reconnecting: "RECONNECTING…",
  offline: "OFFLINE",
};

export interface ConnectionStatusProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof connectionStatusVariants> {}

export const ConnectionStatus = ({
  status = "online",
  className,
  ...props
}: ConnectionStatusProps) => (
  <div
    className={cn(connectionStatusVariants({ status }), className)}
    title="Click for connection details"
    role="status"
    {...props}
  >
    <StatusDot
      status={CONNECTION_DOT[status ?? "online"]}
      size="sm"
      glow={status === "online"}
      pulse={status === "reconnecting"}
    />
    {CONNECTION_LABEL[status ?? "online"]}
  </div>
);

// ─── 7.2 FOOTER STAT ──────────────────────────────────────────────────────────
export interface FooterStatProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label?: string;
}

export const FooterStat = ({
  value,
  label,
  className,
  ...props
}: FooterStatProps) => (
  <div
    className={cn(
      "flex items-center gap-1.25",
      "font-['Share_Tech_Mono',monospace] text-[10px]",
      className,
    )}
    {...props}
  >
    <span className="text-(--theme-fg-muted)">{value}</span>
    {label && <span className="text-(--theme-fg-dim)">{label}</span>}
  </div>
);

/* ============================================================================
   8. PRESET SELECT (Base UI Select)
   ============================================================================ */

export interface PresetSelectProps extends React.ComponentPropsWithoutRef<
  typeof BaseSelect.Root
> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const PresetSelect = ({
  options,
  placeholder = "Select preset…",
  className,
  ...props
}: PresetSelectProps) => (
  <BaseSelect.Root {...props}>
    <BaseSelect.Trigger
      className={cn(
        "flex items-center justify-between w-full gap-1.5",
        "px-2.5 py-1.5",
        "bg-(--theme-elevated) border border-(--theme-border)",
        "rounded-(--radius-badge)",
        "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em]",
        "text-(--theme-fg-muted) cursor-pointer",
        "hover:border-(--theme-accent) hover:text-(--theme-fg)",
        "data-[state=open]:border-(--theme-accent) data-[state=open]:text-(--theme-fg)",
        "transition-all duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Diamond
          size={9}
          strokeWidth={2.5}
          className="text-(--theme-accent) shrink-0"
          aria-hidden="true"
        />
        <BaseSelect.Value placeholder={placeholder} />
      </span>
      <BaseSelect.Icon className="text-(--theme-fg-dim) transition-transform duration-150 data-[state=open]:rotate-180 shrink-0 flex items-center">
        <ChevronDown size={11} strokeWidth={2} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>

    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4} align="start">
        <BaseSelect.Popup
          className={cn(
            "min-w-(--anchor-width)",
            "bg-(--theme-elevated) border border-(--theme-border)",
            "rounded-(--radius-panel)",
            "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
            "py-1 z-50",
            "data-starting-style:opacity-0 data-starting-style:scale-[0.96]",
            "transition-[opacity,scale] duration-150 origin-top",
          )}
        >
          {options.map((opt) => (
            <BaseSelect.Item
              key={opt.value}
              value={opt.value}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.75",
                "font-['Barlow_Condensed',sans-serif] text-[11px] uppercase tracking-[0.06em]",
                "text-(--theme-fg-muted) cursor-pointer",
                "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
                "data-selected:text-(--theme-accent) data-selected:bg-(--theme-accent-dim)",
                "outline-none focus-visible:bg-(--theme-overlay)",
                "transition-colors duration-100",
              )}
            >
              <BaseSelect.ItemIndicator className="w-2.5 text-(--theme-accent) shrink-0 flex items-center">
                <Check size={10} strokeWidth={2.5} />
              </BaseSelect.ItemIndicator>
              <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
            </BaseSelect.Item>
          ))}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  </BaseSelect.Root>
);

/* ============================================================================
   8. NEW v2 PRIMITIVES
   ============================================================================ */

// ─── 8.1 POPOVER ──────────────────────────────────────────────────────────────
// Reusable themed wrapper around Base UI Popover.
// Composes Root → Trigger → Portal → Positioner → Popup with our styling.
//
// Usage:
//   <Popover>
//     <PopoverTrigger render={<Button intent="ghost" size="icon">...</Button>} />
//     <PopoverContent>...content...</PopoverContent>
//   </Popover>

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<
  typeof BasePopover.Popup
> {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  popupClassName?: string;
}

export const PopoverContent = ({
  sideOffset = 6,
  align = "center",
  side = "bottom",
  className,
  popupClassName,
  children,
  ...props
}: PopoverContentProps) => (
  <BasePopover.Portal>
    <BasePopover.Positioner sideOffset={sideOffset} align={align} side={side}>
      <BasePopover.Popup
        className={cn(
          "z-50 outline-none",
          "bg-(--theme-elevated) border border-(--theme-border)",
          "rounded-(--radius-panel)",
          "shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.4)]",
          // Entry animation via Base UI data-starting-style
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96]",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96]",
          "transition-[opacity,scale] duration-150 origin-top",
          popupClassName,
          className,
        )}
        {...props}
      >
        {children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  </BasePopover.Portal>
);

// ─── 8.2 SWITCH ───────────────────────────────────────────────────────────────
// Base UI Switch with theme styling.
// Uses data-[checked] state attribute (Base UI v1+ convention).

const switchVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center",
    "rounded-full border transition-colors duration-180",
    "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-(--theme-base)",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    // Off (default) state
    "bg-(--theme-elevated) border-(--theme-border)",
    // On state
    "data-[checked]:bg-(--theme-accent) data-[checked]:border-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-[16px] w-[28px]",
        md: "h-[20px] w-[36px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const switchThumbVariants = cva(
  [
    "block rounded-full bg-(--theme-fg-muted) shadow-sm",
    "transition-transform duration-180 ease-out",
    // When parent is checked, thumb shifts right + becomes dark base color
    "data-[checked]:bg-(--theme-base)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-3 translate-x-[1px] data-[checked]:translate-x-[13px]",
        md: "size-4 translate-x-[1px] data-[checked]:translate-x-[17px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SwitchProps
  extends
    React.ComponentPropsWithoutRef<typeof BaseSwitch.Root>,
    VariantProps<typeof switchVariants> {}

export const Switch = ({ size, className, ...props }: SwitchProps) => (
  <BaseSwitch.Root
    className={cn(switchVariants({ size }), className)}
    {...props}
  >
    <BaseSwitch.Thumb className={switchThumbVariants({ size })} />
  </BaseSwitch.Root>
);

// ─── 8.3 ICON BUTTON ──────────────────────────────────────────────────────────
// Thin wrapper around Base UI Button for icon-only actions.
// Difference from regular Button: no text typography, square aspect ratio,
// no uppercase letter-spacing, slimmer hover state.

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-(--radius-badge) cursor-pointer select-none",
    "transition-all duration-150",
    "outline-none disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    "focus-visible:ring-offset-1 focus-visible:ring-offset-(--theme-base)",
  ].join(" "),
  {
    variants: {
      intent: {
        default: [
          "bg-transparent text-(--theme-fg-muted)",
          "hover:bg-(--theme-elevated) hover:text-(--theme-fg)",
          "active:scale-[0.96]",
        ].join(" "),
        active: [
          "bg-(--theme-accent-dim) text-(--theme-accent)",
          "border border-(--theme-accent)",
          "hover:bg-(--theme-accent-dim) hover:brightness-110",
        ].join(" "),
        ghost: [
          "bg-transparent text-(--theme-fg-dim)",
          "hover:text-(--theme-fg)",
        ].join(" "),
      },
      size: {
        sm: "size-6",
        md: "size-7",
        lg: "size-8",
      },
    },
    defaultVariants: { intent: "default", size: "md" },
  },
);

export interface IconButtonProps
  extends
    React.ComponentPropsWithoutRef<typeof BaseButton>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ intent, size, className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(iconButtonVariants({ intent, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

// ─── 8.4 RADIO CARD ───────────────────────────────────────────────────────────
// Card-style radio button (shadcn pattern).
// Composes Base UI Radio.Root + Radio.Indicator with custom layout.
//
// Usage:
//   <RadioCardGroup value={mode} onValueChange={setMode}>
//     <RadioCard value="time" icon={<Clock size={14} />} title="Time" subtitle="UTC ref" />
//     <RadioCard value="depth" icon={<Ruler size={14} />} title="Depth" subtitle="ft MD ref" />
//   </RadioCardGroup>

export const RadioCardGroup = BaseRadioGroup;

const radioCardVariants = cva(
  [
    "relative flex items-center cursor-pointer select-none",
    "border rounded-(--radius-badge) transition-all duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    // Off state
    "bg-(--theme-elevated) border-(--theme-border)",
    "hover:border-(--theme-fg-dim) hover:bg-(--theme-overlay)",
    // On state — Base UI sets data-[checked] on Radio.Root
    "data-[checked]:bg-(--theme-accent-dim) data-[checked]:border-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "min-h-[36px]",
        md: "min-h-[44px]",
      },
      compact: {
        true: "justify-center px-2 py-2 gap-0",
        false: "px-2.5 py-2 gap-2.5",
      },
    },
    defaultVariants: { size: "md", compact: false },
  },
);

export interface RadioCardProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof BaseRadio.Root>, "title">,
    VariantProps<typeof radioCardVariants> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const RadioCard = ({
  icon,
  title,
  subtitle,
  size,
  compact,
  className,
  ...props
}: RadioCardProps) => (
  <BaseRadio.Root
    className={cn(radioCardVariants({ size, compact }), className)}
    aria-label={compact ? title : undefined}
    title={compact ? title : undefined}
    {...props}
  >
    {/* Icon — always rendered if provided */}
    {icon && (
      <span className="shrink-0 text-(--theme-fg-muted) data-[checked]:text-(--theme-accent) flex items-center">
        {icon}
      </span>
    )}

    {/* Text content — hidden in compact mode */}
    {!compact && (
      <div className="flex-1 min-w-0">
        <div className="font-['Barlow_Condensed',sans-serif] text-[12px] font-bold uppercase tracking-[0.06em] text-(--theme-fg) leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim) leading-tight mt-px">
            {subtitle}
          </div>
        )}
      </div>
    )}

    {/* Indicator dot — only visible when checked, hidden in compact */}
    {!compact && (
      <BaseRadio.Indicator className="shrink-0 flex items-center justify-center">
        <span className="size-2 rounded-full bg-(--theme-accent)" />
      </BaseRadio.Indicator>
    )}
  </BaseRadio.Root>
);

// ─── 8.5 LIVE BADGE ───────────────────────────────────────────────────────────
// Live / Frozen state indicator. Pulses when LIVE.

const liveBadgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 px-2 py-0.5",
    "rounded-(--radius-badge) border",
    "font-['Share_Tech_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.1em]",
    "transition-colors duration-200 select-none",
  ].join(" "),
  {
    variants: {
      state: {
        live: [
          "text-(--theme-ok)",
          "bg-[color-mix(in_srgb,var(--theme-ok)_12%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-ok)_35%,transparent)]",
        ].join(" "),
        frozen: [
          "text-(--theme-fg-dim)",
          "bg-(--theme-elevated)",
          "border-(--theme-border)",
        ].join(" "),
      },
    },
    defaultVariants: { state: "frozen" },
  },
);

export interface LiveBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof liveBadgeVariants> {}

export const LiveBadge = ({
  state = "frozen",
  className,
  ...props
}: LiveBadgeProps) => (
  <span className={cn(liveBadgeVariants({ state }), className)} {...props}>
    {/* Status dot (pulsing when live) */}
    <span
      className={cn(
        "size-1.5 rounded-full shrink-0",
        state === "live"
          ? "bg-(--theme-ok) shadow-[0_0_6px_var(--theme-ok)] animate-glow-pulse"
          : "bg-(--theme-fg-dim)",
      )}
    />
    {state === "live" ? "LIVE" : "FROZEN"}
  </span>
);

// ─── 8.6 RANGE PRESET BUTTON ──────────────────────────────────────────────────
// Toggle-style button for range presets in Zoom popover (1h, 6h, This Shift, etc.)

const rangePresetButtonVariants = cva(
  [
    "inline-flex items-center justify-center px-2.5 py-1.5",
    "rounded-(--radius-badge) border cursor-pointer select-none",
    "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em]",
    "transition-all duration-150 outline-none",
    "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      active: {
        true: [
          "bg-(--theme-accent-dim) border-(--theme-accent) text-(--theme-accent)",
        ].join(" "),
        false: [
          "bg-(--theme-elevated) border-(--theme-border) text-(--theme-fg-muted)",
          "hover:border-(--theme-fg-dim) hover:text-(--theme-fg)",
        ].join(" "),
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { active: false, fullWidth: false },
  },
);

export interface RangePresetButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rangePresetButtonVariants> {}

export const RangePresetButton = ({
  active,
  fullWidth,
  className,
  ...props
}: RangePresetButtonProps) => (
  <button
    type="button"
    className={cn(rangePresetButtonVariants({ active, fullWidth }), className)}
    aria-pressed={active}
    {...props}
  />
);

// ─── 8.7 TRACK FOOTER ROW ─────────────────────────────────────────────────────
// Single legend row in a track footer.
// Shows: color swatch, trace name, range (min ── max), unit.
// Click toggles visibility.
//
// Usage:
//   <TrackFooterRow
//     trace="rpm" name="RPM" min="0" max="200" unit="rpm"
//     visible={true}
//     onToggle={() => ...}
//   />

const trackFooterRowVariants = cva(
  [
    "flex items-center gap-2 px-2 py-1 cursor-pointer",
    "transition-opacity duration-150 select-none",
    "border-b border-(--theme-border-subtle) last:border-b-0",
    "hover:bg-[color-mix(in_srgb,var(--theme-elevated)_60%,transparent)]",
  ].join(" "),
  {
    variants: {
      visible: {
        true: "opacity-100",
        false: "opacity-45",
      },
    },
    defaultVariants: { visible: true },
  },
);

export interface TrackFooterRowProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle">,
    VariantProps<typeof trackFooterRowVariants> {
  trace: React.ComponentProps<typeof TraceColor>["trace"];
  name: string;
  min: string | number;
  max: string | number;
  unit: string;
  onToggle?: () => void;
}

export const TrackFooterRow = ({
  trace,
  name,
  min,
  max,
  unit,
  visible = true,
  onToggle,
  className,
  ...props
}: TrackFooterRowProps) => (
  <div
    role="checkbox"
    aria-checked={visible}
    onClick={onToggle}
    className={cn(trackFooterRowVariants({ visible }), className)}
    {...props}
  >
    {/* Color swatch — solid when visible, dotted when hidden */}
    <span className="shrink-0 flex items-center w-3">
      {visible ? (
        <TraceColor trace={trace} type="line" />
      ) : (
        <span
          className="block w-3 h-px border-t border-dashed"
          style={{
            borderColor: `var(--trace-${trace}, var(--theme-fg-dim))`,
          }}
        />
      )}
    </span>

    {/* Trace name */}
    <span className="font-['Barlow_Condensed',sans-serif] text-[10px] font-bold uppercase tracking-[0.08em] text-(--theme-fg) min-w-[44px] shrink-0">
      {name}
    </span>

    {/* Range: min ─── max with subtle ticks */}
    <span className="flex-1 flex items-center gap-1.5 min-w-0">
      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-muted) tabular-nums shrink-0">
        {min}
      </span>
      <span className="flex-1 h-px bg-(--theme-border) min-w-3" />
      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-muted) tabular-nums shrink-0">
        {max}
      </span>
    </span>

    {/* Unit */}
    <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim) lowercase shrink-0 min-w-[42px] text-right">
      {unit}
    </span>
  </div>
);

// ─── 8.8 GAUGE CARD COMPACT ───────────────────────────────────────────────────
// Slim sidebar variant of GaugeCard.
// 2-column grid friendly (~110px wide cards).
// Status drives left-border accent + subtle bg tint.

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
  // Map status to ValueReadout color
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

/* ============================================================================
   9. POLISHING v2 — RailSection, Slider, PopoverHeader/Title/Description
   ============================================================================ */

// ─── 9.1 RAIL SECTION ─────────────────────────────────────────────────────────
// Section divider for left tool rail.
// Renders "label + horizontal line" header above its children.
// When `collapsed` is true, label hides — only the line separator remains.
//
// Usage:
//   <RailSection label="Mode">
//     <RadioCardGroup>...</RadioCardGroup>
//   </RailSection>

export interface RailSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  collapsed?: boolean;
}

export const RailSection = ({
  label,
  collapsed = false,
  className,
  children,
  ...props
}: RailSectionProps) => (
  <div className={cn("flex flex-col gap-1.5", className)} {...props}>
    {collapsed ? (
      // Collapsed: line only, no label
      <div className="h-px bg-(--theme-border) -mx-2" aria-hidden="true" />
    ) : (
      // Expanded: label + flex line
      <header className="flex items-center gap-2">
        <span className="section-heading shrink-0">{label}</span>
        <div className="flex-1 h-px bg-(--theme-border)" aria-hidden="true" />
      </header>
    )}
    <div className="flex flex-col gap-1.5">{children}</div>
  </div>
);

// ─── 9.2 SLIDER ───────────────────────────────────────────────────────────────
// Base UI Slider with theme styling. Single canonical size.
// Used for: Display Settings track widths (visual only in v2 polish).
//
// Usage:
//   <Slider value={width} onValueChange={setWidth} min={0} max={100} step={1} />

const sliderRootClass = cn(
  "relative flex items-center select-none touch-none w-full h-5",
);

const sliderTrackClass = cn(
  "relative h-1 grow rounded-full bg-(--theme-border)",
);

const sliderIndicatorClass = cn(
  "absolute h-full rounded-full bg-(--theme-accent)",
);

const sliderThumbClass = cn(
  "block size-3 rounded-full bg-(--theme-fg) border-2 border-(--theme-accent)",
  "shadow-sm cursor-grab active:cursor-grabbing",
  "transition-transform duration-100",
  "hover:scale-110",
  "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--theme-base)",
  "data-[dragging]:scale-110",
);

export interface SliderProps extends React.ComponentPropsWithoutRef<
  typeof BaseSlider.Root
> {
  trackClassName?: string;
  thumbClassName?: string;
}

export const Slider = ({
  className,
  trackClassName,
  thumbClassName,
  ...props
}: SliderProps) => (
  <BaseSlider.Root className={cn(sliderRootClass, className)} {...props}>
    <BaseSlider.Control className="relative flex items-center w-full h-full">
      <BaseSlider.Track className={cn(sliderTrackClass, trackClassName)}>
        <BaseSlider.Indicator className={sliderIndicatorClass} />
      </BaseSlider.Track>
      <BaseSlider.Thumb className={cn(sliderThumbClass, thumbClassName)} />
    </BaseSlider.Control>
  </BaseSlider.Root>
);

// ─── 9.3 POPOVER SUB-COMPONENTS ───────────────────────────────────────────────
// Adopted from shadcn snippet pattern. Provides consistent popover structure:
//   <PopoverContent>
//     <PopoverHeader>
//       <PopoverTitle>...</PopoverTitle>
//       <PopoverDescription>...</PopoverDescription>
//     </PopoverHeader>
//     ...content...
//   </PopoverContent>

export interface PopoverHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PopoverHeader = ({ className, ...props }: PopoverHeaderProps) => (
  <div
    className={cn(
      "flex flex-col gap-0.5 px-4 py-3",
      "border-b border-(--theme-border)",
      className,
    )}
    {...props}
  />
);

export interface PopoverTitleProps extends React.ComponentPropsWithoutRef<
  typeof BasePopover.Title
> {}

export const PopoverTitle = ({ className, ...props }: PopoverTitleProps) => (
  <BasePopover.Title
    className={cn(
      "font-['Barlow_Condensed',sans-serif] text-[13px] font-bold",
      "uppercase tracking-[0.08em] text-(--theme-fg) leading-tight",
      className,
    )}
    {...props}
  />
);

export interface PopoverDescriptionProps extends React.ComponentPropsWithoutRef<
  typeof BasePopover.Description
> {}

export const PopoverDescription = ({
  className,
  ...props
}: PopoverDescriptionProps) => (
  <BasePopover.Description
    className={cn(
      "font-['Barlow',sans-serif] text-[11px]",
      "text-(--theme-fg-muted) leading-snug",
      className,
    )}
    {...props}
  />
);
