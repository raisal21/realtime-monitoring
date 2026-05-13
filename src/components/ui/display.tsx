import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button as BaseButton } from "@base-ui/react/button";

// Imports from core

/* ============================================================================
   8-9. DISPLAY COMPONENTS
   ============================================================================ */

// ─── 8.5 LIVE BADGE ───────────────────────────────────────────────────
// Live / Frozen state indicator. Pulses when LIVE.

const liveBadgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 px-2 py-0.5",
    "rounded-(--radius-badge) border",
    "font-['Share_Tech_Mono',monospace] text-fs-10 font-bold uppercase tracking-[0.1em]",
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
    "font-['Barlow_Condensed',sans-serif] text-fs-11 font-semibold uppercase tracking-[0.06em]",
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
    React.ComponentPropsWithoutRef<typeof BaseButton>,
    VariantProps<typeof rangePresetButtonVariants> {}

export const RangePresetButton = ({
  ref,
  active,
  fullWidth,
  className,
  ...props
}: RangePresetButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => (
  <BaseButton
    ref={ref}
    className={cn(rangePresetButtonVariants({ active, fullWidth }), className)}
    aria-pressed={active ?? undefined}
    {...props}
  />
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
