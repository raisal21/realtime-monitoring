import * as React from "react";
import { Diamond, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Base UI
import { Select as BaseSelect } from "@base-ui/react/select";

/* ============================================================================
   8. PRESET SELECT (Base UI Select)
   ============================================================================ */

export interface PresetSelectProps extends React.ComponentPropsWithoutRef<
  typeof BaseSelect.Root
> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const PresetSelect = ({
  options,
  placeholder = "Select preset…",
  className,
  ...props
}: PresetSelectProps) => (
  <BaseSelect.Root {...props}>
    <BaseSelect.Trigger
      className={cn(
        "flex items-center justify-between w-full gap-1.5",
        "px-2.5 py-1.5",
        "bg-(--theme-elevated) border border-(--theme-border)",
        "rounded-(--radius-badge)",
        "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em]",
        "text-(--theme-fg-muted) cursor-pointer",
        "hover:border-(--theme-accent) hover:text-(--theme-fg)",
        "data-[state=open]:border-(--theme-accent) data-[state=open]:text-(--theme-fg)",
        "transition-all duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent)",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Diamond
          size={9}
          strokeWidth={2.5}
          className="text-(--theme-accent) shrink-0"
          aria-hidden="true"
        />
        <BaseSelect.Value placeholder={placeholder} />
      </span>
      <BaseSelect.Icon className="text-(--theme-fg-dim) transition-transform duration-150 data-[state=open]:rotate-180 shrink-0 flex items-center">
        <ChevronDown size={11} strokeWidth={2} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>

    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4} align="start">
        <BaseSelect.Popup
          className={cn(
            "min-w-(--anchor-width)",
            "bg-(--theme-elevated) border border-(--theme-border)",
            "rounded-(--radius-panel)",
            "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
            "py-1 z-50",
            "data-starting-style:opacity-0 data-starting-style:scale-[0.96]",
            "transition-[opacity,scale] duration-150 origin-top",
          )}
        >
          {options.map((opt) => (
            <BaseSelect.Item
              key={opt.value}
              value={opt.value}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.75",
                "font-['Barlow_Condensed',sans-serif] text-[11px] uppercase tracking-[0.06em]",
                "text-(--theme-fg-muted) cursor-pointer",
                "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
                "data-selected:text-(--theme-accent) data-selected:bg-(--theme-accent-dim)",
                "outline-none focus-visible:bg-(--theme-overlay)",
                "transition-colors duration-100",
              )}
            >
              <BaseSelect.ItemIndicator className="w-2.5 text-(--theme-accent) shrink-0 flex items-center">
                <Check size={10} strokeWidth={2.5} />
              </BaseSelect.ItemIndicator>
              <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
            </BaseSelect.Item>
          ))}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  </BaseSelect.Root>
);
