import { GripVertical, RotateCcw } from "lucide-react";
import { useChart } from "../../../stores/dashboard-store";
import { TRACKS_META } from "../../../data/dashboard-static";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  Slider,
  Switch,
  Button,
  cn,
} from "../../../components";

export function DisplayLayoutPopoverContent() {
  const { state: chart, dispatch } = useChart();

  return (
    <PopoverContent
      align="start"
      sideOffset={6}
      side="right"
      popupClassName="w-[320px] max-h-[480px] overflow-y-auto scrollbar-thin"
    >
      <PopoverHeader>
        <PopoverTitle>Display Settings</PopoverTitle>
        <PopoverDescription>Track order, widths, and visibility</PopoverDescription>
      </PopoverHeader>

      <div className="px-4 py-3 border-b border-(--theme-border)">
        <span className="section-heading block mb-2">Track Order</span>
        <div className="flex flex-col gap-1">
          {chart.trackOrder.map((trackId) => {
            const meta = TRACKS_META.find((t) => t.id === trackId);
            if (!meta) return null;
            return (
              <div
                key={trackId}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-(--radius-badge)",
                  "bg-(--theme-elevated) border border-(--theme-border)",
                  "cursor-grab",
                )}
              >
                <GripVertical
                  size={12}
                  strokeWidth={2}
                  className="text-(--theme-fg-dim) shrink-0"
                />
                <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold text-(--theme-fg)">
                  {meta.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-(--theme-border)">
        <span className="section-heading block mb-3">Track Widths</span>
        <div className="flex flex-col gap-3">
          {chart.trackOrder.map((trackId) => {
            const meta = TRACKS_META.find((t) => t.id === trackId);
            if (!meta) return null;
            const width = chart.trackWidths[trackId] ?? meta.defaultWidth;

            return (
              <div key={trackId} className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-['Barlow_Condensed',sans-serif] text-[10px] font-semibold text-(--theme-fg-muted) truncate">
                  {meta.name}
                </span>
                <Slider
                  value={[width]}
                  onValueChange={(vals) =>
                    dispatch({
                      type: "SET_TRACK_WIDTH",
                      trackId,
                      width: Array.isArray(vals) ? vals[0] : vals as number,
                    })
                  }
                  min={meta.isFixed ? 130 : 10}
                  max={meta.isFixed ? 130 : 100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-fg-dim) tabular-nums shrink-0">
                  {meta.isFixed ? `${width}px` : `${width}%`}
                </span>
              </div>
            );
          })}
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="mt-3 w-full"
          onClick={() => dispatch({ type: "RESET_TRACK_LAYOUT" })}
        >
          <RotateCcw size={11} strokeWidth={2} />
          Reset to default
        </Button>
      </div>

      <div className="px-4 py-3">
        <span className="section-heading block mb-2">Track Visibility</span>
        <div className="flex flex-col gap-2">
          {chart.trackOrder.map((trackId) => {
            const meta = TRACKS_META.find((t) => t.id === trackId);
            if (!meta) return null;
            const visible = chart.trackVisibility[trackId] ?? true;

            return (
              <div key={trackId} className="flex items-center justify-between">
                <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold text-(--theme-fg)">
                  {meta.name}
                </span>
                <Switch
                  checked={visible}
                  size="sm"
                  onCheckedChange={() =>
                    dispatch({ type: "TOGGLE_TRACK_VISIBILITY", trackId })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </PopoverContent>
  );
}