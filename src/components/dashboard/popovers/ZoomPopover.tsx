import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Activity, BarChart2 } from "lucide-react";
import { useChart } from "@/stores/dashboard-store";
import { RANGE_PRESETS_QUICK, WELL_SESSION } from "@/data/dashboard-static";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/popover";
import { LiveBadge, RangePresetButton } from "@/components/display";
import { Button } from "@/components/core";
import { cn } from "@/lib/utils";

const toHHMM = (minutes: number) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = Math.floor(minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const fromHHMM = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const inputCls = cn(
  "flex-1 min-w-0 px-2 py-1 rounded-(--radius-badge)",
  "bg-(--theme-elevated) border border-(--theme-border)",
  "font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-fg)",
  "focus:outline-none focus:border-(--theme-accent)",
  "tabular-nums",
);

export function ZoomPopoverContent() {
  const { state, dispatch } = useChart();

  const axisRange =
    state.mode === "time"
      ? WELL_SESSION.timeAxis.range
      : WELL_SESSION.depthAxis.range;

  const currentRange = state.manualRange ?? axisRange;

  const [draftMin, setDraftMin] = useState(currentRange.min);
  const [draftMax, setDraftMax] = useState(currentRange.max);

  useEffect(() => {
    const r = state.manualRange ?? axisRange;
    setDraftMin(r.min);
    setDraftMax(r.max);
  }, [state.manualRange, state.mode]);

  const handleApply = useCallback(() => {
    const min = Math.min(draftMin, draftMax);
    const max = Math.max(draftMin, draftMax);
    dispatch({ type: "SET_MANUAL_RANGE", min, max });
  }, [draftMin, draftMax, dispatch]);

  const isTimeMode = state.mode === "time";

  return (
    <PopoverContent
      align="start"
      sideOffset={6}
      side="right"
      popupClassName="w-[280px]"
    >
      <PopoverHeader>
        <div className="flex items-center justify-between pr-2">
          <PopoverTitle>Zoom & Range</PopoverTitle>
          <LiveBadge state={state.liveMode ? "live" : "frozen"} />
        </div>
        <PopoverDescription>Adjust time range and zoom level</PopoverDescription>
      </PopoverHeader>

      {/* Zoom To — quick presets */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Zoom To</span>
        <div className="grid grid-cols-3 gap-1.5">
          {RANGE_PRESETS_QUICK.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id && !state.manualRange}
              onClick={() => dispatch({ type: "SET_RANGE_PRESET", preset: p.id })}
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      {/* Range — date/depth range picker */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">
          {isTimeMode ? "Time Range" : "Depth Range"}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-7 shrink-0 font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold text-(--theme-fg-muted)">
              From
            </span>
            {isTimeMode ? (
              <input
                type="time"
                value={toHHMM(draftMin)}
                onChange={(e) => setDraftMin(fromHHMM(e.target.value))}
                className={inputCls}
              />
            ) : (
              <>
                <input
                  type="number"
                  value={draftMin}
                  onChange={(e) => setDraftMin(Number(e.target.value))}
                  className={inputCls}
                />
                <span className="label-mono text-(--theme-fg-dim) shrink-0">ft</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-7 shrink-0 font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold text-(--theme-fg-muted)">
              To
            </span>
            {isTimeMode ? (
              <input
                type="time"
                value={toHHMM(draftMax)}
                onChange={(e) => setDraftMax(fromHHMM(e.target.value))}
                className={inputCls}
              />
            ) : (
              <>
                <input
                  type="number"
                  value={draftMax}
                  onChange={(e) => setDraftMax(Number(e.target.value))}
                  className={inputCls}
                />
                <span className="label-mono text-(--theme-fg-dim) shrink-0">ft</span>
              </>
            )}
          </div>

          <div className="flex gap-1.5 mt-0.5">
            <Button
              intent="primary"
              size="sm"
              fullWidth
              onClick={handleApply}
            >
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
      </div>

      {/* Following Live */}
      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Mode</span>
        <Button
          intent={state.liveMode ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => dispatch({ type: "TOGGLE_LIVE" })}
        >
          <Activity size={12} strokeWidth={2} />
          {state.liveMode ? "Following Live" : "Resume Live"}
        </Button>
      </div>

      {/* DataZoom Slider toggle */}
      <div className="px-3 py-2.5">
        <Button
          intent={state.dataZoomSlider ? "primary" : "ghost"}
          size="sm"
          fullWidth
          onClick={() => dispatch({ type: "TOGGLE_DATAZOOM_SLIDER" })}
        >
          <BarChart2 size={12} strokeWidth={2} />
          {state.dataZoomSlider ? "Hide Range Slider" : "Show Range Slider"}
        </Button>
      </div>
    </PopoverContent>
  );
}
