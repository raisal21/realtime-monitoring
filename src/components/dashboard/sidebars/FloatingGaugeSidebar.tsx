import { ChevronRight } from "lucide-react";
import { useUi } from "../../../stores/dashboard-store";
import { GAUGES } from "../../../data/dashboard-static";
import { IconButton, GaugeCardCompact, cn } from "../../../components";

const GAUGE_SIDEBAR_WIDTH = 240;

export function FloatingGaugeSidebar({ rightPosition }: { rightPosition: number }) {
  const { dispatch } = useUi();

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 z-30",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "flex flex-col overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.4)]",
        "animate-sidebar-slide-in-right",
      )}
      style={{
        width: GAUGE_SIDEBAR_WIDTH,
        right: rightPosition,
        transition: "right 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="flex items-center px-3 py-2 border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading flex-1">Gauges</span>
        <IconButton
          intent="ghost"
          size="sm"
          onClick={() => dispatch({ type: "TOGGLE_GAUGE_SIDEBAR" })}
          aria-label="Collapse gauges sidebar"
          title="Collapse (Cmd+.)"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-2 gap-px bg-(--theme-border)">
          {GAUGES.map((g) => (
            <GaugeCardCompact
              key={g.id}
              label={g.label}
              value={g.value}
              unit={g.unit}
              status={g.status}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}