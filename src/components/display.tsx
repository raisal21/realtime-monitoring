import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Imports from core
import { TraceColor, type TraceColorProps } from "@/components/core";

/* ============================================================================
   8-9. DISPLAY COMPONENTS
   ============================================================================ */

// ─── 8.5 LIVE BADGE ───────────────────────────────────────────────────
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

// ─── 8.6 RANGE PRESET BUTTON ──────────────────────────────────────────
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
    aria-pressed={active ?? undefined}
    {...props}
  />
);

// ─── 8.7 TRACK FOOTER ROW ─────────────────────────────────────────────
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
  trace: TraceColorProps["trace"];
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
    aria-checked={visible ?? undefined}
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

// ─── 9.1 RAIL SECTION ─────────────────────────────────────────────────
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
