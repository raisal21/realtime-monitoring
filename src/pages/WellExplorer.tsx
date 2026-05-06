import { useRef, useState, useCallback, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { WELLS, type Well } from "@/data/wells";
import { WellMap } from "@/components/well-explorer/map/WellMap";
import { MapOverlay } from "@/components/well-explorer/map/MapOverlay";
import { DetailPanel } from "@/components/well-explorer/map/DetailPanel";
import { useMaplibre } from "@/components/well-explorer/map/useMaplibre";
import { ExplorerSubheader } from "@/components/well-explorer/shell/ExplorerSubheader";
import { ExplorerSidebar } from "@/components/well-explorer/sidebar/ExplorerSidebar";
import { POPUP_STYLES } from "@/components/well-explorer/lib/utils";

export default function WellExplorer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<Well["wellType"] | "all">("all");

  const debouncedQuery = useDebouncedValue(query, 150);

  const filteredWells = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return WELLS.filter((w) => {
      const matchesQuery =
        !q || w.name.toLowerCase().includes(q) || w.padId.toLowerCase().includes(q);
      const matchesType = activeType === "all" || w.wellType === activeType;
      return matchesQuery && matchesType;
    });
  }, [debouncedQuery, activeType]);

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

      <div
        className="grid h-full w-full overflow-hidden"
        style={{
          gridTemplateRows:
            "var(--spacing-rt-shell-sub) 1fr",
        }}
      >
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
