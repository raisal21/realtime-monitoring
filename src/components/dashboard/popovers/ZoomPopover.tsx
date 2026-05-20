"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch } from "react";
import { format } from "date-fns";
import {
  Activity,
  BarChart2,
  CalendarRange,
} from "lucide-react";
import { useChart } from "@/store/app-store";
import type { RangePreset } from "@/store/slices/chart-slice";
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
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/Calendar";
import { TimePicker } from "@/components/ui/TimePicker";
import { LiveBadge, RangePresetButton } from "@/components/ui/display";
import { Button, Surface } from "@/components/ui/core";
import { cn } from "@/lib/utils";

// =============================================================================
// Local reducer (avoids cascading setState-in-effect)
// =============================================================================

interface LocalState {
  min: number;
  max: number;
  fromDate: Date | undefined;
  toDate: Date | undefined;
  fromOpen: boolean;
  toOpen: boolean;
}

type LocalAction =
  | { type: "SET_MIN"; value: number }
  | { type: "SET_MAX"; value: number }
  | { type: "SET_FROM_DATE"; value: Date | undefined }
  | { type: "SET_TO_DATE"; value: Date | undefined }
  | { type: "SET_FROM_OPEN"; value: boolean }
  | { type: "SET_TO_OPEN"; value: boolean }
  | { type: "SYNC_FROM_RULER"; min: number; max: number; fromDate: Date; toDate: Date };

function localReducer(state: LocalState, action: LocalAction): LocalState {
  switch (action.type) {
    case "SET_MIN":
      return { ...state, min: action.value };
    case "SET_MAX":
      return { ...state, max: action.value };
    case "SET_FROM_DATE":
      return { ...state, fromDate: action.value };
    case "SET_TO_DATE":
      return { ...state, toDate: action.value };
    case "SET_FROM_OPEN":
      return { ...state, fromOpen: action.value };
    case "SET_TO_OPEN":
      return { ...state, toOpen: action.value };
    case "SYNC_FROM_RULER":
      return {
        ...state,
        min: action.min,
        max: action.max,
        fromDate: action.fromDate,
        toDate: action.toDate,
      };
  }
}



function useRulerSync(
  state: ReturnType<typeof useChart>["state"],
  axisRange: { min: number; max: number },
  dispatch: Dispatch<LocalAction>,
) {
  // We intentionally call useEffect here inside a custom hook so the component
  // body stays pure. The hook *is* the effect boundary.
  useEffect(() => {
    if (state.mode !== "time") return;
    const r = state.rulerRange ?? axisRange;
    const startWall = sessionMinuteToDate(r.min);
    const endWall = sessionMinuteToDate(r.max);
    dispatch({
      type: "SYNC_FROM_RULER",
      min: startWall.getHours() * 60 + startWall.getMinutes(),
      max: endWall.getHours() * 60 + endWall.getMinutes(),
      fromDate: new Date(startWall.getFullYear(), startWall.getMonth(), startWall.getDate()),
      toDate: new Date(endWall.getFullYear(), endWall.getMonth(), endWall.getDate()),
    });
  }, [state.rulerRange, state.mode, axisRange, dispatch]);
}

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

  // Single reducer avoids cascading renders from multiple setStates in an effect.
  const [local, localDispatch] = useReducer(localReducer, {
    min: initialDraftMin,
    max: initialDraftMax,
    fromDate: initialFromDate,
    toDate: initialToDate,
    fromOpen: false,
    toOpen: false,
  });

  const [pendingPreset, setPendingPreset] = useState<RangePreset | null>(null);
  const isLocked = state.rulerRange !== null || state.logTrackRange !== null;

  const handlePresetClick = useCallback(
    (preset: RangePreset) => {
      if (isLocked) {
        setPendingPreset(preset);
        return;
      }
      dispatch({ type: "SET_RANGE_PRESET", preset });
    },
    [isLocked, dispatch],
  );

  const handleConfirmPreset = useCallback(() => {
    if (pendingPreset === null) return;
    dispatch({ type: "SET_LIVE", live: true });
    dispatch({ type: "SET_RANGE_PRESET", preset: pendingPreset });
    setPendingPreset(null);
  }, [pendingPreset, dispatch]);

  // Sync local state from store when ruler range changes externally.
  useRulerSync(state, axisRange, localDispatch);

  const fromLabel = local.fromDate
    ? format(local.fromDate, "MMM dd, yyyy")
    : "—";
  const toLabel = local.toDate
    ? format(local.toDate, "MMM dd, yyyy")
    : "—";

  const handleApply = useCallback(() => {
    if (!local.fromDate || !local.toDate) return;

    let min: number;
    let max: number;

    if (state.mode === "time") {
      // Combine date (midnight) + minutes-of-day, convert to minutes since
      // SESSION_START_DATE — the unit the Time Ruler renders.
      const startMs =
        new Date(local.fromDate.getFullYear(), local.fromDate.getMonth(), local.fromDate.getDate()).getTime() +
        local.min * 60_000;
      const endMs =
        new Date(local.toDate.getFullYear(), local.toDate.getMonth(), local.toDate.getDate()).getTime() +
        local.max * 60_000;
      const a = dateToSessionMinute(new Date(startMs));
      const b = dateToSessionMinute(new Date(endMs));
      min = Math.min(a, b);
      max = Math.max(a, b);
    } else {
      // Depth mode: derive depth at each picked date via the well profile.
      const a = wellProfileDepthAt(local.fromDate);
      const b = wellProfileDepthAt(local.toDate);
      min = Math.min(a, b);
      max = Math.max(a, b);
    }

    if (min === max) return; // ignore empty range

    // Reducer handles cascade: enters slider mode, clears live & preset.
    dispatch({ type: "SET_RULER_RANGE", min, max });
  }, [local.fromDate, local.toDate, local.min, local.max, state.mode, dispatch]);

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
              onClick={() => handlePresetClick(p.id)}
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
          <Popover open={local.fromOpen} onOpenChange={(v) => localDispatch({ type: "SET_FROM_OPEN", value: v })}>
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
                defaultMonth={local.fromDate}
                selected={local.fromDate}
                onSelect={(date) => {
                  localDispatch({ type: "SET_FROM_DATE", value: date ?? undefined });
                  localDispatch({ type: "SET_FROM_OPEN", value: false });
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

          <TimePicker value={local.min} onChange={(v) => localDispatch({ type: "SET_MIN", value: v })} />
        </div>

        {/* To — Date + Time side by side */}
        <div className="flex gap-1.5 mb-2">
          <Popover open={local.toOpen} onOpenChange={(v) => localDispatch({ type: "SET_TO_OPEN", value: v })}>
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
                defaultMonth={local.toDate}
                selected={local.toDate}
                onSelect={(date) => {
                  localDispatch({ type: "SET_TO_DATE", value: date ?? undefined });
                  localDispatch({ type: "SET_TO_OPEN", value: false });
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

          <TimePicker value={local.max} onChange={(v) => localDispatch({ type: "SET_MAX", value: v })} />
        </div>

        <div className="flex gap-1.5 mt-2.5">
          <Button intent="primary" size="sm" fullWidth onClick={handleApply}>
            Apply
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

      {pendingPreset !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
          onClick={() => setPendingPreset(null)}
        >
          <Surface
            elevation="elevated"
            outline="all"
            className="w-[360px] animate-fade-up shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-(--theme-border)">
              <span className="font-['Barlow_Condensed',sans-serif] text-fs-14 font-bold uppercase tracking-[0.08em]">
                Discard custom range?
              </span>
            </div>
            <div className="px-5 py-3 text-fs-12 text-(--theme-fg-dim)">
              Switching to {pendingPreset} releases the locked viewport and resumes live tracking.
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-(--theme-border)">
              <Button
                intent="ghost"
                size="sm"
                onClick={() => setPendingPreset(null)}
              >
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleConfirmPreset}>
                Confirm
              </Button>
            </div>
          </Surface>
        </div>
      )}
    </PopoverContent>
  );
}
