import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// =============================================================================
// 2. TELEMETRY DATA DISPLAY
// =============================================================================

// =============================================================================
// 2.1 VALUE READOUT
// =============================================================================
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

