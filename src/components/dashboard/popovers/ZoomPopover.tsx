"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  RotateCcw,
  Activity,
  BarChart2,
  CalendarRange,
} from "lucide-react";
import { useChart } from "@/stores/dashboard-store";
import {
  RANGE_PRESETS_QUICK,
  WELL_SESSION,
  WELL_PROFILE_START_DATE,
  WELL_PROFILE_END_DATE,
} from "@/data/dashboard-static";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { LiveBadge, RangePresetButton } from "@/components/display";
import { Button } from "@/components/core";
import { cn } from "@/lib/utils";

export function ZoomPopoverContent() {
  const { state, dispatch } = useChart();

  const axisRange =
    state.mode === "time"
      ? WELL_SESSION.timeAxis.range
      : WELL_SESSION.depthAxis.range;

  const currentRange = state.manualRange ?? axisRange;

  const [draftMin, setDraftMin] = useState(currentRange.min);
  const [draftMax, setDraftMax] = useState(currentRange.max);
  const [fromDate, setFromDate] = useState<Date | undefined>(
    WELL_PROFILE_START_DATE,
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    WELL_PROFILE_END_DATE,
  );
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  useEffect(() => {
    const r = state.manualRange ?? axisRange;
    setDraftMin(r.min);
    setDraftMax(r.max);
  }, [state.manualRange, state.mode]);

  const fromLabel = fromDate
    ? format(fromDate, "MMM dd, yyyy")
    : "—";
  const toLabel = toDate
    ? format(toDate, "MMM dd, yyyy")
    : "—";

  const handleApply = useCallback(() => {
    const min = Math.min(draftMin, draftMax);
    const max = Math.max(draftMin, draftMax);
    dispatch({ type: "SET_MANUAL_RANGE", min, max });
  }, [draftMin, draftMax, dispatch]);

  return (
    <PopoverContent
      align="start"
      sideOffset={6}
      side="right"
      popupClassName="w-[320px]"
    >
      <PopoverHeader>
        <div className="flex items-center justify-between pr-2">
          <PopoverTitle>Zoom & Range</PopoverTitle>
          <LiveBadge state={state.liveMode ? "live" : "frozen"} />
        </div>
        <PopoverDescription>
          Adjust time range and zoom level
        </PopoverDescription>
      </PopoverHeader>

      {/* Zoom To — quick presets */}
      <div className="px-rt-pad-sm py-rt-pad-sm border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Zoom To</span>
        <div className="grid grid-cols-3 gap-1.5">
          {RANGE_PRESETS_QUICK.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id && !state.manualRange}
              onClick={() =>
                dispatch({ type: "SET_RANGE_PRESET", preset: p.id })
              }
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      {/* Date & Time Range — compact side-by-side */}
      <div className="px-rt-pad-sm py-rt-pad-sm border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Date & Time</span>

        {/* From — Date + Time side by side */}
        <div className="flex gap-1.5 mb-2">
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger
              className={cn(
                "group flex-1 flex items-stretch",
                "rounded-(--radius-badge) overflow-hidden",
                "bg-(--theme-elevated) border border-(--theme-border)",
                "hover:border-(--theme-accent) transition-colors",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-(--theme-accent)",
              )}
            >
              <div className="flex flex-col items-start flex-1 min-w-0 px-2.5 py-1.5">
                <span className="font-['Barlow_Condensed',sans-serif] text-fs-9 font-bold uppercase tracking-[0.14em] text-(--theme-fg-dim) leading-none">
                  From
                </span>
                <span className="font-['Share_Tech_Mono',monospace] tabular-nums text-fs-13 font-semibold text-(--theme-fg) leading-tight mt-0.5">
                  {fromLabel}
                </span>
              </div>
              <div className="flex items-center justify-center px-2 border-l border-(--theme-border-subtle) text-(--theme-fg-muted) group-hover:text-(--theme-accent) transition-colors">
                <CalendarRange size={13} strokeWidth={2} />
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} popupClassName="p-0">
              <Calendar
                mode="single"
                defaultMonth={fromDate}
                selected={fromDate}
                onSelect={(date) => {
                  setFromDate(date ?? undefined);
                  setFromOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <TimePicker value={draftMin} onChange={setDraftMin} />
        </div>

        {/* To — Date + Time side by side */}
        <div className="flex gap-1.5 mb-2">
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger
              className={cn(
                "group flex-1 flex items-stretch",
                "rounded-(--radius-badge) overflow-hidden",
                "bg-(--theme-elevated) border border-(--theme-border)",
                "hover:border-(--theme-accent) transition-colors",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-(--theme-accent)",
              )}
            >
              <div className="flex flex-col items-start flex-1 min-w-0 px-2.5 py-1.5">
                <span className="font-['Barlow_Condensed',sans-serif] text-fs-9 font-bold uppercase tracking-[0.14em] text-(--theme-fg-dim) leading-none">
                  To
                </span>
                <span className="font-['Share_Tech_Mono',monospace] tabular-nums text-fs-13 font-semibold text-(--theme-fg) leading-tight mt-0.5">
                  {toLabel}
                </span>
              </div>
              <div className="flex items-center justify-center px-2 border-l border-(--theme-border-subtle) text-(--theme-fg-muted) group-hover:text-(--theme-accent) transition-colors">
                <CalendarRange size={13} strokeWidth={2} />
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} popupClassName="p-0">
              <Calendar
                mode="single"
                defaultMonth={toDate}
                selected={toDate}
                onSelect={(date) => {
                  setToDate(date ?? undefined);
                  setToOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <TimePicker value={draftMax} onChange={setDraftMax} />
        </div>

        {/* Apply / Reset */}
        <div className="flex gap-1.5 mt-2.5">
          <Button intent="primary" size="sm" fullWidth onClick={handleApply}>
            Apply
          </Button>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => dispatch({ type: "RESET_ZOOM" })}
          >
            <RotateCcw size={11} strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Following Live */}
      <div className="px-rt-pad-sm py-rt-pad-sm border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Mode</span>
        <Button
          intent={state.liveMode ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => {
            const newLiveState = !state.liveMode;
            dispatch({ type: "SET_LIVE", live: newLiveState });
            dispatch({ type: "SET_DATAZOOM_SLIDER", value: !newLiveState });
          }}
        >
          <Activity size={12} strokeWidth={2} />
          {state.liveMode ? "Following Live" : "Resume Live"}
        </Button>
      </div>

      {/* DataZoom Slider toggle */}
      <div className="px-rt-pad-sm py-rt-pad-sm">
        <Button
          intent={state.dataZoomSlider ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => {
            const newSliderState = !state.dataZoomSlider;
            dispatch({ type: "SET_DATAZOOM_SLIDER", value: newSliderState });
            dispatch({ type: "SET_LIVE", live: !newSliderState });
          }}
        >
          <BarChart2 size={12} strokeWidth={2} />
          Slider
        </Button>
      </div>
    </PopoverContent>
  );
}
