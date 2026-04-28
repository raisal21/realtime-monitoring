"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Base UI
import { Popover as BasePopover } from "@base-ui/react/popover";

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
    <BasePopover.Positioner sideOffset={sideOffset} align={align} side={side} className="z-[200]">
      <BasePopover.Popup
        className={cn(
          "relative outline-none",
          "bg-(--theme-elevated) border border-(--theme-border)",
          "rounded-(--radius-panel)",
          "shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.4)]",
          popupClassName,
          className
        )}
        {...props}
      >
        {children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  </BasePopover.Portal>
);

export const PopoverArrow = (props: React.ComponentProps<typeof BasePopover.Arrow>) => (
  <BasePopover.Arrow
    className={cn("fill-(--theme-border)", props.className)}
    {...props}
  />
);

export const PopoverBackdrop = (props: React.ComponentProps<typeof BasePopover.Backdrop>) => (
  <BasePopover.Backdrop
    className={cn(
      "fixed inset-0 z-[199] bg-black/40",
      "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
      "transition-all duration-150",
      props.className
    )}
    {...props}
  />
);