import { ZoomIn, ZoomOut, RotateCcw, Activity } from "lucide-react";
import { useChart } from "../../../stores/dashboard-store.tsx";
import { RANGE_PRESETS_QUICK, RANGE_PRESETS_DOMAIN } from "../../../data/dashboard-static";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  LiveBadge,
  RangePresetButton,
  Button,
} from "../../../components";

export function ZoomPopoverContent() {
  const { state, dispatch } = useChart();

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

      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Zoom To</span>
        <div className="grid grid-cols-3 gap-1.5">
          {RANGE_PRESETS_QUICK.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id}
              onClick={() =>
                dispatch({ type: "SET_RANGE_PRESET", preset: p.id })
              }
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Drilling Range</span>
        <div className="flex flex-col gap-1.5">
          {RANGE_PRESETS_DOMAIN.map((p) => (
            <RangePresetButton
              key={p.id}
              active={state.rangePreset === p.id}
              fullWidth
              onClick={() =>
                dispatch({ type: "SET_RANGE_PRESET", preset: p.id })
              }
            >
              {p.label}
            </RangePresetButton>
          ))}
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Manual</span>
        <div className="flex gap-1.5">
          <Button
            intent="secondary"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "ZOOM_IN" })}
          >
            <ZoomIn size={12} strokeWidth={2} />
            In
          </Button>
          <Button
            intent="secondary"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "ZOOM_OUT" })}
          >
            <ZoomOut size={12} strokeWidth={2} />
            Out
          </Button>
          <Button
            intent="ghost"
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: "RESET_ZOOM" })}
          >
            <RotateCcw size={12} strokeWidth={2} />
            Reset
          </Button>
        </div>
      </div>

      <div className="px-3 py-2.5">
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
    </PopoverContent>
  );
}