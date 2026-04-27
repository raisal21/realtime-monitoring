import * as React from "react";
import { cn } from "@/lib/utils";

// Base UI
import { Popover as BasePopover } from "@base-ui/react/popover";

/* ============================================================================
   8. NEW v2 PRIMITIVES — POPOVER
   ============================================================================ */

// ─── 8.1 POPOVER ──────────────────────────────────────────────────────
// Reusable themed wrapper around Base UI Popover.
// Composes Root → Trigger → Portal → Positioner → Popup with our styling.
//
// Usage:
//   <Popover>
//     <PopoverTrigger render={<Button intent="ghost" size="icon">...</Button>} />
//     <PopoverContent>...content...</PopoverContent>
//   </Popover>

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
          // Entry animation via Base UI data-starting-style
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96]",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96]",
          "transition-[opacity,scale] duration-150 origin-top",
          popupClassName,
          className,
        )}
        {...props}
      >
        {children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  </BasePopover.Portal>
);

// ─── 9.3 POPOVER SUB-COMPONENTS ───────────────────────────────────────
// Adopted from shadcn snippet pattern. Provides consistent popover structure:
//   <PopoverContent>
//     <PopoverHeader>
//       <PopoverTitle>...</PopoverTitle>
//       <PopoverDescription>...</PopoverDescription>
//     </PopoverHeader>
//     ...content...
//   </PopoverContent>

export type PopoverHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const PopoverHeader = ({ className, ...props }: PopoverHeaderProps) => (
  <div
    className={cn(
      "flex flex-col gap-0.5 px-4 py-3",
      "border-b border-(--theme-border)",
      className,
    )}
    {...props}
  />
);

export type PopoverTitleProps = React.ComponentPropsWithoutRef<typeof BasePopover.Title>;

export const PopoverTitle = ({ className, ...props }: PopoverTitleProps) => (
  <BasePopover.Title
    className={cn(
      "font-['Barlow_Condensed',sans-serif] text-[13px] font-bold",
      "uppercase tracking-[0.08em] text-(--theme-fg) leading-tight",
      className,
    )}
    {...props}
  />
);

export type PopoverDescriptionProps = React.ComponentPropsWithoutRef<
  typeof BasePopover.Description
>;

export const PopoverDescription = ({
  className,
  ...props
}: PopoverDescriptionProps) => (
  <BasePopover.Description
    className={cn(
      "font-['Barlow',sans-serif] text-[11px]",
      "text-(--theme-fg-muted) leading-snug",
      className,
    )}
    {...props}
  />
);
