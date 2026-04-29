"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={formatters}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "size-7 inline-flex items-center justify-center rounded-(--radius-badge)",
          "text-(--theme-fg-muted) hover:text-(--theme-fg)",
          "hover:bg-(--theme-overlay) transition-colors",
          "aria-disabled:opacity-30 aria-disabled:pointer-events-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "size-7 inline-flex items-center justify-center rounded-(--radius-badge)",
          "text-(--theme-fg-muted) hover:text-(--theme-fg)",
          "hover:bg-(--theme-overlay) transition-colors",
          "aria-disabled:opacity-30 aria-disabled:pointer-events-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center px-7",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "font-['Barlow_Condensed',sans-serif] text-[13px] font-bold",
          "uppercase tracking-[0.12em] text-(--theme-fg)",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 h-7 inline-flex items-center justify-center",
          "font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold uppercase",
          "tracking-[0.1em] text-(--theme-fg-dim)",
          defaultClassNames.weekday,
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        week_number: cn(
          "text-[0.8rem] text-(--theme-fg-muted) select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group relative flex-1 aspect-square h-7 p-0 text-center select-none",
          "font-['Share_Tech_Mono',monospace] text-[14px] tabular-nums",
          "text-(--theme-fg)",
          "[&>button]:size-full [&>button]:rounded-(--radius-badge)",
          "[&>button]:inline-flex [&>button]:items-center [&>button]:justify-center",
          "[&>button]:transition-colors [&>button]:cursor-pointer",
          "[&>button]:hover:bg-(--theme-overlay)",
          "[&>button]:focus-visible:outline-none",
          "[&>button]:focus-visible:ring-1 [&>button]:focus-visible:ring-(--theme-accent)",
          defaultClassNames.day,
        ),
        selected: cn(
          "[&>button]:!bg-(--theme-accent)",
          "[&>button]:!text-(--theme-fg)",
          defaultClassNames.selected,
        ),
        range_start: cn(
          "rounded-l-(--radius-badge) bg-(--theme-accent-dim)",
          "[&>button]:!bg-(--theme-accent) [&>button]:!text-(--theme-fg)",
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          "bg-(--theme-accent-dim)",
          "[&>button]:!bg-transparent [&>button]:!text-(--theme-fg)",
          defaultClassNames.range_middle,
        ),
        range_end: cn(
          "rounded-r-(--radius-badge) bg-(--theme-accent-dim)",
          "[&>button]:!bg-(--theme-accent) [&>button]:!text-(--theme-fg)",
          defaultClassNames.range_end,
        ),
        today: cn(
          "[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-(--theme-accent)",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-(--theme-fg-dim) opacity-60",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-(--theme-fg-dim) opacity-40",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          return (
            <ChevronRightIcon className={cn("size-4", className)} {...props} />
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
