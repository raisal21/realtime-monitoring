"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";

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
      className={cn(
        "p-2",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={formatters}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-4", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "p-1 rounded hover:bg-(--theme-elevated)",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "p-1 rounded hover:bg-(--theme-elevated)",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "font-['Barlow_Condensed',sans-serif] text-sm font-semibold text-(--theme-fg)",
          defaultClassNames.caption_label
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-center text-[10px] font-medium text-(--theme-fg-muted)",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative aspect-square h-7 w-full rounded p-0 text-center text-xs select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l bg-(--theme-accent) text-[#0c0e10] rounded-r-none",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none bg-(--theme-accent) text-[#0c0e10]", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r bg-(--theme-accent) text-[#0c0e10] rounded-l-none",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded bg-(--theme-elevated) text-(--theme-fg)",
          defaultClassNames.today
        ),
        outside: cn(
          "text-(--theme-fg-muted) opacity-50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-(--theme-fg-muted) opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronRightIcon
              className={cn("size-4", className)}
              {...props}
            />
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };