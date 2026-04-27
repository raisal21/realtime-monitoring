import { DEPTH_TICKS } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

export function DepthRuler({ isPrimary }: { isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
        isPrimary && "border-r-(--theme-accent)",
      )}
      style={{ width: 58 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading block",
            isPrimary ? "text-(--theme-accent)" : "text-(--theme-fg-dim)",
          )}
        >
          Depth
        </span>
        <div className="label-mono mt-0.5">ft MD</div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Major grid bands */}
        {DEPTH_TICKS.filter((t) => t.major).map((tick) => (
          <div
            key={`band-${tick.depth}`}
            className="absolute left-0 right-0 h-px bg-(--theme-border-subtle)"
            style={{ top: `${tick.pct}%` }}
          />
        ))}

        {DEPTH_TICKS.map((tick) => (
          <div
            key={tick.depth}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${tick.pct}%` }}
          >
            <div
              className={cn(
                "h-px",
                tick.major
                  ? isPrimary
                    ? "w-3 bg-(--theme-accent)"
                    : "w-3 bg-(--theme-fg-dim)"
                  : "w-1.5 bg-(--theme-border)",
              )}
            />
            {tick.major && (
              <span
                className={cn(
                  "font-['Share_Tech_Mono',monospace] text-[8px] ml-1 tabular select-none",
                  isPrimary ? "text-(--theme-fg-muted)" : "text-(--theme-fg-dim)",
                )}
              >
                {tick.depth}
              </span>
            )}
          </div>
        ))}

        {/* Current depth cursor */}
        <div
          className="absolute left-0 right-0 z-10 flex items-center"
          style={{ top: "86%" }}
        >
          <div
            className={cn(
              "h-[2px] w-full",
              isPrimary ? "bg-(--theme-accent)" : "bg-(--theme-fg-dim)",
            )}
          />
        </div>
        {isPrimary && (
          <div
            className="absolute right-0 z-10 w-1.5 h-1.5 rounded-full bg-(--theme-accent) animate-live-pulse"
            style={{ top: "86%", transform: "translateY(-50%)" }}
          />
        )}
      </div>
    </div>
  );
}
