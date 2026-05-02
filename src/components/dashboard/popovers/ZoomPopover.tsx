"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  SESSION_START_DATE,
  SESSION_END_DATE,
  dateToSessionMinute,
  sessionMinuteToDate,
  wellProfileDepthAt,
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

  // Calendar bounds depend on mode: time mode is constrained by the session
  // wall-clock window; depth mode is constrained by the well-profile span,
  // since handleApply maps date → depth via wellProfileDepthAt.
  const calendarBounds = useMemo(() => {
    if (state.mode === "time") {
      return { from: SESSION_START_DATE, to: SESSION_END_DATE };
    }
    return { from: WELL_PROFILE_START_DATE, to: WELL_PROFILE_END_DATE };
  }, [state.mode]);

  const initialFromDate = state.mode === "time"
    ? SESSION_START_DATE
    : WELL_PROFILE_START_DATE;
  const initialToDate = state.mode === "time"
    ? SESSION_END_DATE
    : WELL_PROFILE_END_DATE;

  // TimePicker holds minutes-of-day (0–1439). Default to the visible window's
  // local time-of-day; in time mode that is rulerRange % 1440, in depth mode
  // we just default to 00:00 / 23:59 since the field is conceptually moot.
  const initialDraftMin = state.mode === "time"
    ? ((state.rulerRange?.min ?? 0) % 1440 + 1440) % 1440
    : 0;
  const initialDraftMax = state.mode === "time"
    ? ((state.rulerRange?.max ?? 1439) % 1440 + 1440) % 1440
    : 1439;

  const [draftMin, setDraftMin] = useState(initialDraftMin);
  const [draftMax, setDraftMax] = useState(initialDraftMax);
  const [fromDate, setFromDate] = useState<Date | undefined>(initialFromDate);
  const [toDate, setToDate] = useState<Date | undefined>(initialToDate);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  useEffect(() => {
    if (state.mode !== "time") return;
    const r = state.rulerRange ?? axisRange;
    // Resolve ruler-range minutes to wall-clock so the day component is kept
    // in sync (otherwise cross-day ranges collapse to the same date).
    const startWall = sessionMinuteToDate(r.min);
    const endWall = sessionMinuteToDate(r.max);
    setFromDate(
      new Date(startWall.getFullYear(), startWall.getMonth(), startWall.getDate()),
    );
    setToDate(
      new Date(endWall.getFullYear(), endWall.getMonth(), endWall.getDate()),
    );
    setDraftMin(startWall.getHours() * 60 + startWall.getMinutes());
    setDraftMax(endWall.getHours() * 60 + endWall.getMinutes());
  }, [state.rulerRange, state.mode, axisRange]);

  const fromLabel = fromDate
    ? format(fromDate, "MMM dd, yyyy")
    : "—";
  const toLabel = toDate
    ? format(toDate, "MMM dd, yyyy")
    : "—";

  const handleApply = useCallback(() => {
    if (!fromDate || !toDate) return;

    let min: number;
    let max: number;

    if (state.mode === "time") {
      // Combine date (midnight) + minutes-of-day, convert to minutes since
      // SESSION_START_DATE — the unit the Time Ruler renders.
      const startMs =
        new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime() +
        draftMin * 60_000;
      const endMs =
        new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime() +
        draftMax * 60_000;
      const a = dateToSessionMinute(new Date(startMs));
      const b = dateToSessionMinute(new Date(endMs));
      min = Math.min(a, b);
      max = Math.max(a, b);
    } else {
      // Depth mode: derive depth at each picked date via the well profile.
      const a = wellProfileDepthAt(fromDate);
      const b = wellProfileDepthAt(toDate);
      min = Math.min(a, b);
      max = Math.max(a, b);
    }

    if (min === max) return; // ignore empty range

    // Reducer handles cascade: enters slider mode, clears live & preset.
    dispatch({ type: "SET_RULER_RANGE", min, max });
  }, [fromDate, toDate, draftMin, draftMax, state.mode, dispatch]);

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
              active={state.liveMode && state.rangePreset === p.id}
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
                startMonth={calendarBounds.from}
                endMonth={calendarBounds.to}
                disabled={{
                  before: calendarBounds.from,
                  after: calendarBounds.to,
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
                startMonth={calendarBounds.from}
                endMonth={calendarBounds.to}
                disabled={{
                  before: calendarBounds.from,
                  after: calendarBounds.to,
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
            // Reducer cascades sliders & rangePreset.
            dispatch({ type: "SET_LIVE", live: !state.liveMode });
          }}
        >
          <Activity size={12} strokeWidth={2} />
          {state.liveMode ? "Following Live" : "Resume Live"}
        </Button>
      </div>

      {/* Slider toggle */}
      <div className="px-rt-pad-sm py-rt-pad-sm">
        <Button
          intent={state.wellProfileSlider || state.rulerSlider ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => {
            // Reducer cascades liveMode & rangePreset.
            dispatch({
              type: "SET_SLIDER_MODE",
              value: !(state.wellProfileSlider || state.rulerSlider),
            });
          }}
        >
          <BarChart2 size={12} strokeWidth={2} />
          Slider
        </Button>
      </div>
    </PopoverContent>
  );
}
