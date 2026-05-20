import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Imports from core
import { StatusDot } from "@/components/ui/core";

// =============================================================================
// 7. FOOTER
// =============================================================================

// =============================================================================
// 7.1 CONNECTION STATUS
// =============================================================================
const connectionStatusVariants = cva(
  [
    "flex items-center gap-[5px]",
    "px-[8px] py-[3px] rounded-(--radius-badge) border",
    "font-['Share_Tech_Mono',monospace] text-fs-9 uppercase tracking-[0.1em]",
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
        connecting: [
          "text-(--theme-warning)",
          "bg-[color-mix(in_srgb,var(--theme-warning)_10%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-warning)_30%,transparent)]",
          "animate-pulse",
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
        error: [
          "text-(--theme-critical)",
          "bg-[color-mix(in_srgb,var(--theme-critical)_15%,transparent)]",
          "border-[color-mix(in_srgb,var(--theme-critical)_45%,transparent)]",
        ].join(" "),
      },
    },
    defaultVariants: { status: "online" },
  },
);

const CONNECTION_DOT: Record<
  NonNullable<VariantProps<typeof connectionStatusVariants>["status"]>,
  VariantProps<typeof StatusDot>["status"]
> = {
  online: "ok",
  connecting: "warning",
  reconnecting: "warning",
  offline: "critical",
  error: "critical",
};

const CONNECTION_LABEL: Record<
  NonNullable<VariantProps<typeof connectionStatusVariants>["status"]>,
  string
> = {
  online: "ONLINE",
  connecting: "CONNECTING…",
  reconnecting: "RECONNECTING…",
  offline: "OFFLINE",
  error: "ERROR",
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
      pulse={status === "reconnecting" || status === "connecting"}
    />
    {CONNECTION_LABEL[status ?? "online"]}
  </div>
);

