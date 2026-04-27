import { useMemo } from "react";
import { FLOW_DATA } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

export function FlowRuler() {
  const KICK_THRESHOLD = 0.1;
  const maxFlow = useMemo(
    () => Math.max(...FLOW_DATA.map((d) => Math.max(d.flowIn, d.flowOut))),
    [],
  );

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0",
        "bg-(--theme-base) border-r border-(--theme-border)",
      )}
      style={{ width: 60 }}
    >
      <div className="px-1.5 py-1.5 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading">Flow</span>
        <div className="flex items-center justify-between">
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-critical)">
            out
          </span>
          <span className="font-['Share_Tech_Mono',monospace] text-[8px] text-(--theme-info)">
            in
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-(--theme-border)" />

        {FLOW_DATA.map((d, i) => {
          const pct = (i / (FLOW_DATA.length - 1)) * 100;
          const inPct = (d.flowIn / maxFlow) * 50;
          const outPct = (d.flowOut / maxFlow) * 50;

          const max = Math.max(d.flowIn, d.flowOut);
          const diff = Math.abs(d.flowIn - d.flowOut) / max;
          const isKick = diff > KICK_THRESHOLD;
          const outDominant = d.flowOut > d.flowIn;

          return (
            <div
              key={i}
              className="absolute left-0 right-0 h-1.5 flex items-center"
              style={{ top: `${pct}%`, transform: "translateY(-50%)" }}
            >
              <div className="absolute right-1/2 h-full">
                <div
                  className={cn(
                    "h-full bg-(--theme-critical) rounded-l-sm",
                    isKick && outDominant && "animate-flow-kick-glow",
                  )}
                  style={{ width: `${outPct * 1.5}px` }}
                />
              </div>
              <div className="absolute left-1/2 h-full">
                <div
                  className={cn(
                    "h-full bg-(--theme-info) rounded-r-sm",
                    isKick && !outDominant && "animate-flow-kick-glow",
                  )}
                  style={{ width: `${inPct * 1.5}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}