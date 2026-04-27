import { useChart } from "../../../stores/dashboard-store";
import { TRACK_TRACES } from "../../../data/dashboard-static";
import { Badge, TrackFooterRow, cn } from "../../../components";

interface LogTrackProps {
  trackId: keyof typeof TRACK_TRACES;
  title: string;
  hz: string;
  stream: "drill" | "geo";
}

export function LogTrack({ trackId, title, hz, stream }: LogTrackProps) {
  const { state: chart, dispatch } = useChart();
  const traces = TRACK_TRACES[trackId];

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-[160px]",
        "border-r border-(--theme-border) last:border-r-0",
        "bg-(--theme-base) overflow-hidden",
        stream === "drill"
          ? "shadow-[inset_2px_0_0_var(--theme-ok)]"
          : "shadow-[inset_2px_0_0_var(--theme-info)]",
      )}
    >
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="section-heading flex-1">{title}</span>
          <Badge intent="neutral" size="xs">
            {hz}
          </Badge>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
        >
          {traces.map((t, i) => {
            const visible = chart.traceVisibility[t.trace];
            if (!visible) return null;
            const points = Array.from({ length: 20 }, (_, j) => {
              const y = (j / 19) * 200;
              const x =
                30 +
                Math.sin(j * 0.5 + i) * 25 +
                Math.cos(j * 0.3 + i * 2) * 15;
              return `${x + i * 5},${y}`;
            }).join(" ");
            return (
              <polyline
                key={t.trace}
                points={points}
                fill="none"
                stroke={`var(--trace-${t.trace})`}
                strokeWidth="1"
                opacity={0.85}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      <div className="border-t border-(--theme-border) bg-(--theme-surface) flex-shrink-0">
        {traces.map((t) => (
          <TrackFooterRow
            key={t.trace}
            trace={t.trace}
            name={t.name}
            min={t.min}
            max={t.max}
            unit={t.unit}
            visible={chart.traceVisibility[t.trace]}
            onToggle={() =>
              dispatch({ type: "TOGGLE_TRACE_VISIBILITY", trace: t.trace })
            }
          />
        ))}
      </div>
    </div>
  );
}