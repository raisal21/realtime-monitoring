import { WELL_PROFILE_DATA } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

export function WellProfileTrack() {
  const maxDepth = 13000;
  const points = WELL_PROFILE_DATA.map((d, i) => {
    const x = (i / (WELL_PROFILE_DATA.length - 1)) * 100;
    const y = (d.depth / maxDepth) * 100;
    return `${x},${y}`;
  }).join(" ");

  const last = WELL_PROFILE_DATA[WELL_PROFILE_DATA.length - 1];
  const lastY = (last.depth / maxDepth) * 100;

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 overflow-hidden",
        "bg-(--theme-surface)",
        "border-r-2 border-r-(--theme-border)",
      )}
      style={{ width: 130 }}
    >
      <div className="px-2 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Well Profile</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="label-mono">depth × time</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="wp-grid"
              width="20"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 14"
                fill="none"
                stroke="var(--theme-border-subtle)"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#wp-grid)" />

          <polygon
            points={`${points} 100,${lastY} 100,100 0,100 0,0`}
            fill="var(--theme-accent)"
            opacity="0.06"
          />

          <polyline
            points={points}
            fill="none"
            stroke="var(--theme-accent)"
            strokeWidth="0.8"
            opacity="0.85"
            vectorEffect="non-scaling-stroke"
          />

          <circle cx="100" cy={lastY} r="1.2" fill="var(--theme-accent)" />
        </svg>

        <div className="absolute top-0.5 left-1 font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          {WELL_PROFILE_DATA[0].date}
        </div>
        <div className="absolute bottom-0.5 right-1 font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          {last.date}
        </div>

        <div
          className="absolute right-1 font-['Share_Tech_Mono',monospace] text-[9px] text-(--theme-accent) bg-(--theme-surface) px-1 py-px rounded-sm"
          style={{ top: `${lastY}%`, transform: "translateY(-50%)" }}
        >
          12,563
        </div>
      </div>

      <div className="px-2 py-1 border-t border-(--theme-border) flex items-center justify-between flex-shrink-0">
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim)">
          TD
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-muted) tabular">
          15,200 ft
        </span>
      </div>
    </div>
  );
}