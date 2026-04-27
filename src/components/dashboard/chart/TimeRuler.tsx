import { TIME_TICKS } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

export function TimeRuler({ isPrimary }: { isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 50 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span
          className={cn(
            "section-heading",
            isPrimary && "text-(--theme-accent)",
          )}
        >
          Time
        </span>
        <div className="label-mono">UTC</div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {TIME_TICKS.map((tick) => (
          <div
            key={tick.time}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${tick.pct}%` }}
          >
            <div
              className={cn(
                "h-px bg-(--theme-border)",
                tick.major ? "w-2.5" : "w-1.5",
              )}
            />
            {tick.major && (
              <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-fg-dim) ml-1 tabular">
                {tick.time}
              </span>
            )}
          </div>
        ))}
        <div
          className="absolute left-0 right-0 h-px bg-(--theme-accent)"
          style={{ top: "86%" }}
        />
      </div>
    </div>
  );
}