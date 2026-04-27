import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// Imports from core
import { StatusDot } from "./core";
import { Button } from "./core";
import { Badge } from "./core";

/* ============================================================================
   5. WELL EXPLORER
   ============================================================================ */

// ─── 5.1 WELL LIST ITEM ───────────────────────────────────────────────
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
  VariantProps<typeof StatusDot>["status"]
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

// ─── 5.2 WELL METRIC ──────────────────────────────────────────────────
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

// ─── 5.3 SIDEBAR STAT ─────────────────────────────────────────────────
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
