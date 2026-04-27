import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Base UI
import { Button as BaseButton } from "@base-ui/react/button";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Slider as BaseSlider } from "@base-ui/react/slider";

/* ============================================================================
   8. NEW v2 PRIMITIVES — FORM COMPONENTS
   ============================================================================ */

// ─── 8.2 SWITCH ───────────────────────────────────────────────────────
// Base UI Switch with theme styling.
// Uses data-[checked] state attribute (Base UI v1+ convention).

const switchVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center",
    "rounded-full border transition-colors duration-180",
    "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-(--theme-base)",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    // Off (default) state
    "bg-(--theme-elevated) border-(--theme-border)",
    // On state
    "data-[checked]:bg-(--theme-accent) data-[checked]:border-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-[16px] w-[28px]",
        md: "h-[20px] w-[36px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const switchThumbVariants = cva(
  [
    "block rounded-full bg-(--theme-fg-muted) shadow-sm",
    "transition-transform duration-180 ease-out",
    // When parent is checked, thumb shifts right + becomes dark base color
    "data-[checked]:bg-(--theme-base)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-3 translate-x-[1px] data-[checked]:translate-x-[13px]",
        md: "size-4 translate-x-[1px] data-[checked]:translate-x-[17px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SwitchProps
  extends
    React.ComponentPropsWithoutRef<typeof BaseSwitch.Root>,
    VariantProps<typeof switchVariants> {}

export const Switch = ({ size, className, ...props }: SwitchProps) => (
  <BaseSwitch.Root
    className={cn(switchVariants({ size }), className)}
    {...props}
  >
    <BaseSwitch.Thumb className={switchThumbVariants({ size })} />
  </BaseSwitch.Root>
);

// ─── 8.3 ICON BUTTON ──────────────────────────────────────────────────
// Thin wrapper around Base UI Button for icon-only actions.
// Difference from regular Button: no text typography, square aspect ratio,
// no uppercase letter-spacing, slimmer hover state.

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-(--radius-badge) cursor-pointer select-none",
    "transition-all duration-150",
    "outline-none disabled:opacity-40 disabled:cursor-not-allowed",
    "focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    "focus-visible:ring-offset-1 focus-visible:ring-offset-(--theme-base)",
  ].join(" "),
  {
    variants: {
      intent: {
        default: [
          "bg-transparent text-(--theme-fg-muted)",
          "hover:bg-(--theme-elevated) hover:text-(--theme-fg)",
          "active:scale-[0.96]",
        ].join(" "),
        active: [
          "bg-(--theme-accent-dim) text-(--theme-accent)",
          "border border-(--theme-accent)",
          "hover:bg-(--theme-accent-dim) hover:brightness-110",
        ].join(" "),
        ghost: [
          "bg-transparent text-(--theme-fg-dim)",
          "hover:text-(--theme-fg)",
        ].join(" "),
      },
      size: {
        sm: "size-6",
        md: "size-7",
        lg: "size-8",
      },
    },
    defaultVariants: { intent: "default", size: "md" },
  },
);

export interface IconButtonProps
  extends
    React.ComponentPropsWithoutRef<typeof BaseButton>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ intent, size, className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(iconButtonVariants({ intent, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

// ─── 8.4 RADIO CARD ───────────────────────────────────────────────────
// Card-style radio button (shadcn pattern).
// Composes Base UI Radio.Root + Radio.Indicator with custom layout.
//
// Usage:
//   <RadioCardGroup value={mode} onValueChange={setMode}>
//     <RadioCard value="time" icon={<Clock size={14} />} title="Time" subtitle="UTC ref" />
//     <RadioCard value="depth" icon={<Ruler size={14} />} title="Depth" subtitle="ft MD ref" />
//   </RadioCardGroup>

export const RadioCardGroup = BaseRadioGroup;

const radioCardVariants = cva(
  [
    "relative flex items-center cursor-pointer select-none",
    "border rounded-(--radius-badge) transition-all duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
    // Off state
    "bg-(--theme-elevated) border-(--theme-border)",
    "hover:border-(--theme-fg-dim) hover:bg-(--theme-overlay)",
    // On state — Base UI sets data-[checked] on Radio.Root
    "data-[checked]:bg-(--theme-accent-dim) data-[checked]:border-(--theme-accent)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "min-h-[36px]",
        md: "min-h-[44px]",
      },
      compact: {
        true: "justify-center px-2 py-2 gap-0",
        false: "px-2.5 py-2 gap-2.5",
      },
    },
    defaultVariants: { size: "md", compact: false },
  },
);

export interface RadioCardProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof BaseRadio.Root>, "title">,
    VariantProps<typeof radioCardVariants> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const RadioCard = ({
  icon,
  title,
  subtitle,
  size,
  compact,
  className,
  ...props
}: RadioCardProps) => (
  <BaseRadio.Root
    className={cn(radioCardVariants({ size, compact }), className)}
    aria-label={compact ? title : undefined}
    title={compact ? title : undefined}
    {...props}
  >
    {/* Icon — always rendered if provided */}
    {icon && (
      <span className="shrink-0 text-(--theme-fg-muted) data-[checked]:text-(--theme-accent) flex items-center">
        {icon}
      </span>
    )}

    {/* Text content — hidden in compact mode */}
    {!compact && (
      <div className="flex-1 min-w-0">
        <div className="font-['Barlow_Condensed',sans-serif] text-[12px] font-bold uppercase tracking-[0.06em] text-(--theme-fg) leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim) leading-tight mt-px">
            {subtitle}
          </div>
        )}
      </div>
    )}

    {/* Indicator dot — only visible when checked, hidden in compact */}
    {!compact && (
      <BaseRadio.Indicator className="shrink-0 flex items-center justify-center">
        <span className="size-2 rounded-full bg-(--theme-accent)" />
      </BaseRadio.Indicator>
    )}
  </BaseRadio.Root>
);

// ─── 9.2 SLIDER ───────────────────────────────────────────────────────
// Base UI Slider with theme styling. Single canonical size.
// Used for: Display Settings track widths (visual only in v2 polish).
//
// Usage:
//   <Slider value={width} onValueChange={setWidth} min={0} max={100} step={1} />

const sliderRootClass = cn(
  "relative flex items-center select-none touch-none w-full h-5",
);

const sliderTrackClass = cn(
  "relative h-1 grow rounded-full bg-(--theme-border)",
);

const sliderIndicatorClass = cn(
  "absolute h-full rounded-full bg-(--theme-accent)",
);

const sliderThumbClass = cn(
  "block size-3 rounded-full bg-(--theme-fg) border-2 border-(--theme-accent)",
  "shadow-sm cursor-grab active:cursor-grabbing",
  "transition-transform duration-100",
  "hover:scale-110",
  "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--theme-base)",
  "data-[dragging]:scale-110",
);

export interface SliderProps extends React.ComponentPropsWithoutRef<
  typeof BaseSlider.Root
> {
  trackClassName?: string;
  thumbClassName?: string;
}

export const Slider = ({
  className,
  trackClassName,
  thumbClassName,
  ...props
}: SliderProps) => (
  <BaseSlider.Root className={cn(sliderRootClass, className)} {...props}>
    <BaseSlider.Control className="relative flex items-center w-full h-full">
      <BaseSlider.Track className={cn(sliderTrackClass, trackClassName)}>
        <BaseSlider.Indicator className={sliderIndicatorClass} />
      </BaseSlider.Track>
      <BaseSlider.Thumb className={cn(sliderThumbClass, thumbClassName)} />
    </BaseSlider.Control>
  </BaseSlider.Root>
);
