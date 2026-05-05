"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { UniversalTopbar } from "@/components/dashboard/shell/UniversalTopbar";
import { WELLS, type Well } from "@/data/wells";
import { WellMap } from "./map/WellMap";
import { MapOverlay } from "./map/MapOverlay";
import { DetailPanel } from "./map/DetailPanel";
import { useMaplibre } from "./map/useMaplibre";
import { ExplorerSubheader } from "./shell/ExplorerSubheader";
import { ExplorerSidebar } from "./sidebar/ExplorerSidebar";
import { POPUP_STYLES } from "./lib/utils";

export function WellExplorerLayout() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<Well["wellType"] | "all">("all");

  const filteredWells = useMemo(() => {
    const q = query.toLowerCase();
    return WELLS.filter((w) => {
      const matchesQuery =
        !q || w.name.toLowerCase().includes(q) || w.padId.toLowerCase().includes(q);
      const matchesType = activeType === "all" || w.wellType === activeType;
      return matchesQuery && matchesType;
    });
  }, [query, activeType]);

  const { coords, flyToWell } = useMaplibre({
    containerRef: mapContainerRef,
    wells: filteredWells,
    onSelectWell: setSelectedWell,
  });

  const handleSidebarSelect = useCallback(
    (well: Well) => {
      setSelectedWell(well);
      flyToWell(well.id);
    },
    [flyToWell],
  );

  return (
    <>
      <style>{POPUP_STYLES}</style>

      <div className="screen-guard">
        <span className="text-[34px] opacity-40">🖥</span>
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          Please open on a desktop or laptop.
        </span>
      </div>

      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{
          gridTemplateRows:
            "var(--spacing-rt-shell-top) var(--spacing-rt-shell-sub) 1fr",
        }}
      >
        <UniversalTopbar />

        <ExplorerSubheader
          query={query}
          onQueryChange={setQuery}
          activeType={activeType}
          onTypeChange={setActiveType}
          total={WELLS.length}
          filtered={filteredWells.length}
        />

        <div className="relative flex overflow-hidden">
          <WellMap containerRef={mapContainerRef} />

          {selectedWell && (
            <DetailPanel
              well={selectedWell}
              onClose={() => setSelectedWell(null)}
            />
          )}

          <MapOverlay coords={coords} />

          <ExplorerSidebar
            wells={filteredWells}
            selectedId={selectedWell?.id ?? null}
            onSelectWell={handleSidebarSelect}
          />
        </div>
      </div>
    </>
  );
}
