import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Base UI — sub-path imports for consistent tree-shaking
import { Button as BaseButton } from "@base-ui/react/button";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";

// =============================================================================
// 1. CORE PRIMITIVES
// =============================================================================

// =============================================================================
// 1.1 BUTTON
// =============================================================================
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
          "bg-(--theme-accent) -[#0c0e10]",
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
        sm: "px-[10px] py-1 text-fs-10 gap-[5px]",
        md: "px-[14px] py-[7px] text-fs-11 gap-[6px]",
        lg: "px-[20px] py-2.5 text-fs-12 gap-2",
        xl: "px-[34px] py-[11px] text-fs-12 gap-2",
        icon: "w-[30px] h-[30px] text-fs-14 p-0",
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

export const Button = ({
  ref,
  className,
  intent,
  size,
  fullWidth,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => (
  <BaseButton
    ref={ref}
    className={cn(buttonVariants({ intent, size, fullWidth }), className)}
    {...props}
  />
);

// =============================================================================
// 1.2 INPUT
// =============================================================================
const inputVariants = cva(
  [
    "w-full bg-transparent border-none outline-none",
    "text-(--theme-fg) font-['Barlow',sans-serif] text-fs-13",
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

export const Input = ({
  ref,
  className,
  wrapperClassName,
  icon,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) => (
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
          "text-fs-12 text-(--theme-fg-dim) pointer-events-none",
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
);

// =============================================================================
// 1.3 SURFACE / PANEL
// =============================================================================
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

export const Surface = ({
  ref,
  elevation,
  outline,
  className,
  ...props
}: SurfaceProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn(surfaceVariants({ elevation, outline }), className)}
    {...props}
  />
);

// =============================================================================
// 1.4 BADGE / CHIP
// =============================================================================
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
        xs: "px-[4px] py-[1px] text-fs-7",
        sm: "px-1 py-[1px] text-fs-8",
        md: "px-2 py-[3px] text-fs-9",
        lg: "px-2.5 py-1 text-fs-10",
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

// =============================================================================
// 1.5 STATUS DOT
// =============================================================================
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

// =============================================================================
// 1.6 TOGGLE GROUP (Base UI)
// =============================================================================
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
      "flex-1 px-rt-pad-sm py-rt-pad-xs cursor-pointer border-none transition-all duration-150",
      "font-['Barlow_Condensed',sans-serif] text-fs-11 font-semibold tracking-[0.06em] uppercase",
      "text-(--theme-fg-dim) bg-(--theme-elevated)",
      "hover:bg-(--theme-overlay) hover:text-(--theme-fg-muted)",
      "data-[pressed]:bg-(--theme-accent) data-[pressed]:text-[#0c0e10] data-[pressed]:font-bold",
      "data-[pressed]:shadow-[0_0_12px_color-mix(in_srgb,var(--theme-accent)_40%,transparent)]",
      "data-[pressed]:brightness-110",
      "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent)",
      className,
    )}
    {...props}
  />
);

