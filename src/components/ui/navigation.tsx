import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/core";

/* ============================================================================
   4. NAVIGATION SHELL
   ============================================================================ */

// ─── 4.1 TOPBAR BUTTON ────────────────────────────────────────────────
// Thin wrapper around core Button for topbar use.
// Defaults to ghost + icon size. For text labels, override size (e.g. size="sm").
// Set alarm to true for critical-colored pulsing alarm button.

export interface TopbarButtonProps extends ButtonProps {
  badgeCount?: number;
  alarm?: boolean;
}

export const TopbarButton = React.forwardRef<
  HTMLButtonElement,
  TopbarButtonProps
>(({ intent = "ghost", size = "icon", alarm, badgeCount, className, children, ...props }, ref) => (
  <Button
    ref={ref}
    intent={alarm ? "danger" : intent}
    size={size}
    className={cn(
      "rounded-(--radius-badge)",
      alarm && "animate-[topbar-alarm-pulse_2s_ease-in-out_infinite]",
      className,
    )}
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
          "font-['Share_Tech_Mono',monospace] text-fs-8 font-bold leading-none",
        )}
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </span>
    )}
  </Button>
));
TopbarButton.displayName = "TopbarButton";

// ─── 4.2 BREADCRUMB ITEM ──────────────────────────────────────────────
const breadcrumbItemVariants = cva(
  "font-['Barlow_Condensed',sans-serif] text-fs-11 transition-colors duration-150",
  {
    variants: {
      type: {
        link: "text-(--theme-fg-muted) hover:text-(--theme-accent) cursor-pointer",
        separator: "text-(--theme-fg-dim) text-fs-10 select-none",
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
