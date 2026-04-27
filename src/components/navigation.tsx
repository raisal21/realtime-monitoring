import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ============================================================================
   4. NAVIGATION SHELL
   ============================================================================ */

// ─── 4.1 TOPBAR BUTTON ────────────────────────────────────────────────
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

// ─── 4.2 BREADCRUMB ITEM ──────────────────────────────────────────────
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
