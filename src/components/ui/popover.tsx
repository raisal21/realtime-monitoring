import * as React from "react";
import { cn } from "@/lib/utils";

// Base UI
import { Popover as BasePopover } from "@base-ui/react/popover";

/* ============================================================================
   8. NEW v2 PRIMITIVES — POPOVER
   ============================================================================ */

// ─── 8.1 POPOVER ──────────────────────────────────────────────────────
// Reusable themed wrapper around Base UI Popover.
// Supports both render prop pattern and asChild pattern:
//   <Popover>
//     <PopoverTrigger render={<Button>...</Button>} />
//     <PopoverContent>...content...</PopoverContent>
//   </Popover>
// Or:
//   <Popover>
//     <PopoverTrigger asChild><Button>...</Button></PopoverTrigger>
//     <PopoverContent>...content...</PopoverContent>
//   </Popover>

export function Popover(props: React.ComponentPropsWithoutRef<typeof BasePopover.Root>) {
  return <BasePopover.Root {...props} />;
}

export interface PopoverTriggerProps extends React.ComponentPropsWithoutRef<typeof BasePopover.Trigger> {
  asChild?: boolean;
}

export const PopoverTrigger = ({
  ref,
  asChild,
  children,
  ...props
}: PopoverTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <BasePopover.Trigger {...props}>
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { ref })}
      </BasePopover.Trigger>
    );
  }
  return <BasePopover.Trigger ref={ref} {...props}>{children}</BasePopover.Trigger>;
};
PopoverTrigger.displayName = "PopoverTrigger";

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
      "flex flex-col gap-0.5 px-rt-pad py-rt-pad-sm",
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
      "font-['Barlow_Condensed',sans-serif] text-fs-13 font-bold",
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
      "font-['Barlow',sans-serif] text-fs-11",
      "text-(--theme-fg-muted) leading-snug",
      className,
    )}
    {...props}
  />
);
