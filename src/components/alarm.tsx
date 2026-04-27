import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// Imports from core
import { Badge } from "./core";
import { Button } from "./core";

/* ============================================================================
   3. ALARM SYSTEM
   ============================================================================ */

// ─── 3.1 FILTER CHIP ──────────────────────────────────────────────────
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

// ─── 3.2 FEED ITEM ────────────────────────────────────────────────────
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
  VariantProps<typeof Badge>["intent"]
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

// ─── 3.3 CRITICAL BANNER ──────────────────────────────────────────────
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
