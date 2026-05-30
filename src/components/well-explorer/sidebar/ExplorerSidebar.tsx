import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SidebarStat, WellListItem } from "@/components/ui/well";
import type { Well } from "@/data/wells";
import { PAD_NAMES } from "@/data/pads";

function getWellMetrics(w: Well) {
  switch (w.phase) {
    case "drilling":
      return [
        { key: "Depth", value: w.currentDepth },
        { key: "ROP", value: w.rop },
        { key: "Days", value: String(w.daysOnWell) },
      ];
    case "producing":
    case "injecting":
      return [
        { key: "Temp", value: w.temperature },
        { key: "Flow", value: w.flowRate },
        { key: "Press", value: w.pressure },
      ];
    case "completion":
    case "shut-in":
      return [{ key: "TD Target", value: w.targetDepth }];
  }
}

interface ExplorerSidebarProps {
  wells: Well[];
  selectedId: string | null;
  onSelectWell: (well: Well) => void;
}

export function ExplorerSidebar({ wells, selectedId, onSelectWell }: ExplorerSidebarProps) {
  const counts = useMemo(
    () => ({
      production: wells.filter((w) => w.wellType === "production").length,
      injection: wells.filter((w) => w.wellType === "injection").length,
      delineation: wells.filter((w) => w.wellType === "delineation").length,
    }),
    [wells],
  );

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden flex-shrink-0 z-10",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "animate-[slide-in-right_.4s_cubic-bezier(.22,1,.36,1)_both]",
      )}
      style={{ width: 320 }}
    >
      <div className="px-[16px] py-[14px] border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading block mb-[10px]">Field Overview</span>
        <div className="grid grid-cols-3 gap-[8px]">
          <SidebarStat value={counts.production} label="Production" colorScheme="ok" />
          <SidebarStat value={counts.injection} label="Injection" colorScheme="info" />
          <SidebarStat value={counts.delineation} label="Delineation" colorScheme="warning" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {wells.map((w) => (
          <WellListItem
            key={w.id}
            name={w.name}
            block={PAD_NAMES[w.padId] ?? w.padId}
            drillingStatus={w.status}
            selected={selectedId === w.id}
            onClick={() => onSelectWell(w)}
            wellType={w.wellType}
            metrics={getWellMetrics(w)}
          />
        ))}
        {wells.length === 0 && (
          <div className="px-[16px] py-[24px] text-center">
            <span className="font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-fg-dim)">
              No wells match your filters
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
