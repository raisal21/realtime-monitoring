"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { UniversalTopbar } from "@/components/dashboard/shell/UniversalTopbar";
import { Footer } from "@/components/dashboard/shell/Footer";
import { Input, Surface, StatusDot, Button } from "@/components/core";
import { ValueReadout } from "@/components/telemetry";
import { SidebarStat, WellListItem } from "@/components/well";
import { WELLS, type Well } from "@/data/wells";
import { cn } from "@/lib/utils";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap Contributors",
      maxzoom: 19,
    },
    terrainSource: {
      type: "raster-dem",
      url: "https://tiles.mapterhorn.com/tilejson.json",
    },
    hillshadeSource: {
      type: "raster-dem",
      url: "https://tiles.mapterhorn.com/tilejson.json",
    },
  },
  layers: [
    { id: "osm", type: "raster", source: "osm" },
    {
      id: "hills",
      type: "hillshade",
      source: "hillshadeSource",
      layout: { visibility: "visible" },
      paint: { "hillshade-shadow-color": "#473B24" },
    },
  ],
  terrain: { source: "terrainSource", exaggeration: 1 },
  sky: {},
};

const BLOCK_BOUNDARY: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Block 7G" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.670, -7.270], [107.675, -7.272], [107.685, -7.274],
          [107.698, -7.278], [107.710, -7.284], [107.712, -7.295],
          [107.708, -7.305], [107.695, -7.312], [107.680, -7.310],
          [107.668, -7.300], [107.665, -7.285], [107.670, -7.270],
        ]],
      },
    },
  ],
};

const PAD_BOUNDARIES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "PAD A · Guntur" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.6938, -7.2938], [107.6968, -7.2940], [107.6970, -7.2968],
          [107.6935, -7.2970], [107.6938, -7.2938],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "PAD B · Talpad" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.6862, -7.2868], [107.6895, -7.2870], [107.6898, -7.2898],
          [107.6860, -7.2896], [107.6862, -7.2868],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "PAD C · North Ridge" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [107.6785, -7.2785], [107.6815, -7.2788], [107.6818, -7.2810],
          [107.6782, -7.2808], [107.6785, -7.2785],
        ]],
      },
    },
  ],
};

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildCollisionLines(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < WELLS.length; i++) {
    for (let j = i + 1; j < WELLS.length; j++) {
      if (WELLS[i].padId !== WELLS[j].padId) continue;
      const dist = haversineMeters(
        [WELLS[i].lon, WELLS[i].lat],
        [WELLS[j].lon, WELLS[j].lat],
      );
      if (dist < 150) {
        features.push({
          type: "Feature",
          properties: { distance: dist.toFixed(0) },
          geometry: {
            type: "LineString",
            coordinates: [
              [WELLS[i].lon, WELLS[i].lat],
              [WELLS[j].lon, WELLS[j].lat],
            ],
          },
        });
      }
    }
  }
  return { type: "FeatureCollection", features };
}

function buildWellsGeoJSON(wells: Well[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: wells.map((w) => ({
      type: "Feature",
      properties: { id: w.id, name: w.name, wellType: w.wellType, status: w.status, padId: w.padId },
      geometry: { type: "Point", coordinates: [w.lon, w.lat] },
    })),
  };
}

const WELL_TYPE_COLOR: Record<Well["wellType"], string> = {
  production: "#b8bb26",
  injection: "#83a598",
  delineation: "#fabd2f",
};

const WELL_TYPE_LABEL: Record<Well["wellType"], string> = {
  production: "Production",
  injection: "Injection",
  delineation: "Delineation",
};

const STATUS_LABEL: Record<Well["status"], string> = {
  drilling: "Drilling",
  standby: "Standby",
  offline: "Offline",
};

const STATUS_DOT: Record<Well["status"], React.ComponentProps<typeof StatusDot>["status"]> = {
  drilling: "ok",
  standby: "warning",
  offline: "inactive",
};

function DetailPanel({
  well,
  onClose,
}: {
  well: Well;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const isActive = well.status === "drilling";
  const barColor =
    well.wellType === "production"
      ? "#b8bb26"
      : well.wellType === "injection"
        ? "#83a598"
        : "#fabd2f";

  return (
    <div
      className={cn(
        "absolute top-[12px] left-[12px] z-40 w-[280px]",
        "overflow-hidden animate-fade-up",
        "shadow-[0_8px_40px_rgba(0,0,0,0.7)]",
      )}
    >
      <Surface elevation="glass" outline="all">
        <div className="h-[3px] w-full" style={{ background: barColor }} />

        <div className="flex items-center gap-[8px] px-[10px] py-[8px] border-b border-(--theme-border)">
          <StatusDot
            status={STATUS_DOT[well.status]}
            size="md"
            glow={isActive}
            pulse={isActive}
            className="flex-shrink-0"
          />
          <span
            className={cn(
              "flex-1 font-['Barlow_Condensed',sans-serif]",
              "text-fs-15 leading-none font-bold tracking-[0.03em] text-(--theme-fg)",
            )}
          >
            {well.name}
            <span className="text-(--theme-fg-dim) font-normal ml-[6px] text-fs-11 leading-none inline-block">
              · {WELL_TYPE_LABEL[well.wellType]}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-[20px] h-[20px] flex items-center justify-center rounded-[2px]",
              "text-fs-13 leading-none inline-block text-(--theme-fg-dim)",
              "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
              "transition-colors duration-120",
            )}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-[8px] px-[10px] py-[6px] border-b border-(--theme-border)">
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.temperature}
              size="md"
              status={isActive ? "ok" : "inactive"}
            />
            <span className="label-mono">Temp</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.flowRate}
              size="md"
              status={isActive ? "info" : "inactive"}
            />
            <span className="label-mono">Flow</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.pressure}
              size="md"
              status={isActive ? "ok" : "inactive"}
            />
            <span className="label-mono">Pressure</span>
          </div>
        </div>

        <div className="px-[10px] py-[8px]">
          {isActive ? (
            <Button intent="primary" size="lg" fullWidth onClick={() => navigate(`/dashboard/${well.id}`)}>
              Enter Control Room →
            </Button>
          ) : (
            <Button intent="secondary" size="lg" fullWidth disabled>
              {STATUS_LABEL[well.status]} — Not Available
            </Button>
          )}
        </div>
      </Surface>
    </div>
  );
}

function MapOverlay({ coords }: { coords: string }) {
  return (
    <div className="absolute bottom-[20px] left-[20px] z-40 flex flex-col gap-[8px]">
      <Surface
        elevation="glass"
        outline="all"
        className="px-[10px] py-[6px] animate-fade-up"
      >
        <span className="section-heading block leading-none mb-[6px]">Well Types</span>
        {(Object.keys(WELL_TYPE_COLOR) as Well["wellType"][]).map((t) => (
          <div key={t} className="flex items-center gap-[7px] mb-[3px] last:mb-0">
            <div
              className="w-[8px] h-[8px] rounded-full"
              style={{ background: WELL_TYPE_COLOR[t] }}
            />
            <span className="font-['Barlow_Condensed',sans-serif] text-fs-10 leading-none inline-block text-(--theme-fg-muted)">
              {WELL_TYPE_LABEL[t]}
            </span>
          </div>
        ))}
      </Surface>

      <Surface
        elevation="glass"
        outline="all"
        className="px-[8px] py-[4px] animate-fade-up [animation-delay:100ms]"
      >
        <span className="font-['Share_Tech_Mono',monospace] text-fs-10 leading-none inline-block text-(--theme-fg-dim)">
          {coords}
        </span>
      </Surface>
    </div>
  );
}

function Sidebar({
  wells,
  selectedId,
  onSelectWell,
}: {
  wells: Well[];
  selectedId: string | null;
  onSelectWell: (well: Well) => void;
}) {
  const counts = useMemo(
    () => ({
      production: wells.filter((w) => w.wellType === "production").length,
      injection: wells.filter((w) => w.wellType === "injection").length,
      delineation: wells.filter((w) => w.wellType === "delineation").length,
    }),
    [wells],
  );

  const padNames: Record<string, string> = {
    "pad-a": "Guntur",
    "pad-b": "Talpad",
    "pad-c": "North Ridge",
  };

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
            block={padNames[w.padId] ?? w.padId}
            drillingStatus={w.status}
            selected={selectedId === w.id}
            onClick={() => onSelectWell(w)}
            onEnter={w.status === "drilling" ? () => {} : undefined}
            wellType={w.wellType}
            metrics={
              w.status === "drilling"
                ? [
                    { key: "Temp", value: w.temperature },
                    { key: "Flow", value: w.flowRate },
                    { key: "Press", value: w.pressure },
                  ]
                : [{ key: "TD Target", value: w.targetDepth }]
            }
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

function Subheader({
  query,
  onQueryChange,
  activeType,
  onTypeChange,
  total,
  filtered,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  activeType: Well["wellType"] | "all";
  onTypeChange: (f: Well["wellType"] | "all") => void;
  total: number;
  filtered: number;
}) {
  const types: { key: Well["wellType"] | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "production", label: "Production" },
    { key: "injection", label: "Injection" },
    { key: "delineation", label: "Delineation" },
  ];

  return (
    <div
      className={cn(
        "flex items-center px-4 gap-3 flex-shrink-0",
        "bg-(--theme-surface) border-b border-(--theme-border)",
      )}
      style={{ height: "var(--spacing-rt-shell-sub)" }}
    >
      <span className="font-['Barlow_Condensed',sans-serif] text-fs-13 font-bold tracking-[0.04em] text-(--theme-fg) flex items-center gap-2">
        <span className="text-(--theme-orange)">▴</span>
        Block 7G · Guntur Geothermal
      </span>

      <div className="w-px h-5 bg-(--theme-border)" />

      <div className="flex items-center gap-1">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTypeChange(t.key)}
            className={cn(
              "px-2.5 py-1 rounded-(--radius-badge)",
              "font-['Barlow_Condensed',sans-serif] text-fs-11 font-semibold tracking-wider",
              "transition-colors duration-150",
              activeType === t.key
                ? "bg-(--theme-accent-dim) text-(--theme-accent)"
                : "text-(--theme-fg-dim) hover:text-(--theme-fg-muted)",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="w-[200px]">
        <Input
          placeholder="Search well…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          icon={
            <span className="text-(--theme-fg-dim)" style={{ fontSize: 13 }}>
              ⌕
            </span>
          }
          wrapperClassName="h-[26px]"
          className="py-0 pr-2 text-fs-11"
        />
      </div>

      <span className="label-mono text-(--theme-fg-dim)">
        {filtered}/{total} wells
      </span>
    </div>
  );
}

function useMaplibre({
  containerRef,
  wells,
  onSelectWell,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  wells: Well[];
  onSelectWell: (well: Well) => void;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const [coords, setCoords] = useState("LAT — · LON —");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [107.69, -7.29],
      zoom: 13,
      pitch: 70,
      maxZoom: 18,
      maxPitch: 85,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true,
      }),
      "top-right",
    );
    map.addControl(
      new maplibregl.TerrainControl({ source: "terrainSource", exaggeration: 1 }),
      "top-right",
    );

    map.on("mousemove", (e) => {
      setCoords(
        `LAT ${e.lngLat.lat.toFixed(4)} · LON ${e.lngLat.lng.toFixed(4)}`,
      );
    });
    map.on("mouseleave", () => setCoords("LAT — · LON —"));

    mapRef.current = map;

    map.on("load", () => {
      // Block boundary
      map.addSource("block-boundary", {
        type: "geojson",
        data: BLOCK_BOUNDARY,
      });
      map.addLayer({
        id: "block-fill",
        type: "fill",
        source: "block-boundary",
        paint: { "fill-color": "#83a598", "fill-opacity": 0.12 },
      });
      // Block outline (halo for contrast on OSM)
      map.addLayer({
        id: "block-outline",
        type: "line",
        source: "block-boundary",
        paint: {
          "line-color": "#0f1214",
          "line-width": 6,
          "line-dasharray": [4, 3],
        },
      });
      map.addLayer({
        id: "block-line",
        type: "line",
        source: "block-boundary",
        paint: {
          "line-color": "#83a598",
          "line-width": 3,
          "line-dasharray": [4, 3],
        },
      });

      // Pad boundary outlines (halo)
      map.addSource("pad-boundaries", {
        type: "geojson",
        data: PAD_BOUNDARIES,
      });
      map.addLayer({
        id: "pad-outline",
        type: "line",
        source: "pad-boundaries",
        paint: {
          "line-color": "#0f1214",
          "line-width": 5,
          "line-dasharray": [3, 2],
        },
      });
      map.addLayer({
        id: "pad-line",
        type: "line",
        source: "pad-boundaries",
        paint: {
          "line-color": "#d79921",
          "line-width": 2.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });

      // Pad labels
      map.addLayer({
        id: "pad-labels",
        type: "symbol",
        source: "pad-boundaries",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, -1.8],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#a89984",
          "text-halo-color": "#0f1214",
          "text-halo-width": 2,
        },
      });

      // Wells
      map.addSource("wells", {
        type: "geojson",
        data: buildWellsGeoJSON(wells),
      });
      map.addLayer({
        id: "well-circles",
        type: "circle",
        source: "wells",
        paint: {
          "circle-radius": [
            "match",
            ["get", "wellType"],
            "production", 8,
            "injection", 7,
            "delineation", 6,
            6,
          ],
          "circle-color": [
            "match",
            ["get", "wellType"],
            "production", "#b8bb26",
            "injection", "#83a598",
            "delineation", "#fabd2f",
            "#5a524a",
          ],
          "circle-opacity": ["case", ["==", ["get", "status"], "offline"], 0.4, 0.9],
          "circle-stroke-color": "#0f1214",
          "circle-stroke-width": 1.5,
        },
      });

      // Well labels
      map.addLayer({
        id: "well-labels",
        type: "symbol",
        source: "wells",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 9,
          "text-font": ["Share Tech Mono", "monospace"],
          "text-offset": [0, 1.4],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#a89984",
          "text-halo-color": "#0f1214",
          "text-halo-width": 2,
        },
      });

      // Anti-collision lines
      map.addSource("collision-lines", {
        type: "geojson",
        data: buildCollisionLines(),
      });
      map.addLayer({
        id: "collision-line",
        type: "line",
        source: "collision-lines",
        paint: {
          "line-color": "#fb4934",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
          "line-opacity": 0.6,
        },
      });

      // Click on wells
      map.on("click", "well-circles", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;
        const wellId = feature.properties.id as string;
        const well = WELLS.find((w) => w.id === wellId);
        if (!well) return;

        onSelectWell(well);

        if (activePopupRef.current) activePopupRef.current.remove();

        const isActive = well.status === "drilling";
        const col = WELL_TYPE_COLOR[well.wellType];
        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 12,
          className: "rtdc-popup",
          maxWidth: "260px",
        })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(well, col, isActive))
          .addTo(map);

        activePopupRef.current = popup;
      });

      map.on("mouseenter", "well-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "well-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update wells data when filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("wells") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildWellsGeoJSON(wells));
    }
  }, [wells]);

  const flyToWell = useCallback(
    (id: string) => {
      const map = mapRef.current;
      if (!map) return;
      const well = wells.find((w) => w.id === id);
      if (!well) return;

      map.flyTo({
        center: [well.lon, well.lat],
        zoom: 15,
        duration: 1400,
        easing: (t) => t * (2 - t),
      });

      if (activePopupRef.current) activePopupRef.current.remove();

      setTimeout(() => {
        const col = WELL_TYPE_COLOR[well.wellType];
        const isActive = well.status === "drilling";
        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 12,
          className: "rtdc-popup",
          maxWidth: "260px",
        })
          .setLngLat([well.lon, well.lat])
          .setHTML(buildPopupHTML(well, col, isActive))
          .addTo(map);

        activePopupRef.current = popup;
      }, 1450);
    },
    [wells],
  );

  return { coords, flyToWell };
}

function buildPopupHTML(well: Well, col: string, isActive: boolean): string {
  const tempCol = isActive ? "#b8bb26" : "#5a524a";
  const flowCol = isActive ? "#83a598" : "#5a524a";
  const activeBtnStyle = isActive
    ? "background:#83a598;color:#0c0e10;"
    : "background:#32302f;color:#5a524a;";

  return /* html */ `
    <div>
      <div class="pop-header">
        <div class="pop-dot" style="background:${col};${isActive ? `box-shadow:0 0 7px ${col};` : ""}"></div>
        <div style="flex:1;">
          <div class="pop-name">${well.name}</div>
          <div class="pop-sub">${WELL_TYPE_LABEL[well.wellType]} · ${STATUS_LABEL[well.status]}</div>
        </div>
      </div>

      <div class="pop-body">
        <div>
          <div class="pop-val" style="color:${tempCol};">${well.temperature}</div>
          <div class="pop-label">Temperature</div>
        </div>
        <div>
          <div class="pop-val" style="color:${flowCol};">${well.flowRate}</div>
          <div class="pop-label">Flow Rate</div>
        </div>
        <div>
          <div class="pop-val" style="color:#ebdbb2;">${well.pressure}</div>
          <div class="pop-label">Pressure</div>
        </div>
        <div>
          <div class="pop-val" style="color:#a89984;">${well.targetDepth}</div>
          <div class="pop-label">TD Target</div>
        </div>
      </div>

      <div class="pop-btn-wrap">
        <button
          class="pop-btn"
          onclick="window.__rtdc_enter('${well.id}')"
          style="${activeBtnStyle}"
          ${!isActive ? "disabled" : ""}
        >${isActive ? "Enter Control Room →" : "Unavailable"}</button>
      </div>
    </div>`;
}

const POPUP_STYLES = `
  /* Density-aware popup — all sizes scale with --fs-scale */
  .rtdc-popup .maplibregl-popup-content {
    background: rgba(34,38,42,0.96);
    backdrop-filter: blur(12px);
    border: 1px solid #3c3836;
    border-radius: 4px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    padding: 0;
    font-size: calc(0.75rem * var(--fs-scale, 1));
    font-family: 'Barlow Condensed', sans-serif;
    color: #ebdbb2;
    line-height: 1.3;
  }
  .rtdc-popup .maplibregl-popup-tip {
    border-top-color: #3c3836;
    border-bottom-color: #3c3836;
  }
  .rtdc-popup .maplibregl-popup-close-button {
    color: #5a524a;
    font-size: calc(1rem * var(--fs-scale, 1));
    top: 6px;
    right: 8px;
    background: none;
    padding: 2px 4px;
    line-height: 1;
  }
  .rtdc-popup .maplibregl-popup-close-button:hover {
    color: #ebdbb2;
    background: rgba(60,56,54,0.5);
    border-radius: 2px;
  }

  /* Popup internal sections */
  .pop-header {
    padding: calc(12px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1)) calc(10px * var(--fs-scale, 1));
    border-bottom: 1px solid #3c3836;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .pop-dot {
    width: 8px; height: 8px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
  }
  .pop-name {
    font-size: calc(0.875rem * var(--fs-scale, 1));
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }
  .pop-sub {
    font-size: calc(0.625rem * var(--fs-scale, 1));
    color: #a89984;
    margin-top: 2px;
    line-height: 1.2;
  }
  .pop-body {
    padding: calc(10px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1));
    border-bottom: 1px solid #3c3836;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .pop-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: calc(0.8125rem * var(--fs-scale, 1));
    line-height: 1.2;
  }
  .pop-label {
    font-size: calc(0.5rem * var(--fs-scale, 1));
    color: #5a524a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.2;
  }
  .pop-btn-wrap {
    padding: calc(10px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1));
  }
  .pop-btn {
    width: 100%;
    padding: calc(8px * var(--fs-scale, 1));
    border: none;
    border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: calc(0.6875rem * var(--fs-scale, 1));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s;
    cursor: pointer;
  }
  .pop-btn[disabled] {
    cursor: not-allowed;
  }

  .maplibregl-ctrl-group {
    background: var(--theme-surface) !important;
    border: 1px solid var(--theme-border) !important;
    border-radius: 3px !important;
    box-shadow: none !important;
    overflow: hidden;
  }
  .maplibregl-ctrl-group button {
    background: var(--theme-surface) !important;
    border-bottom: 1px solid var(--theme-border) !important;
    width: 28px !important;
    height: 28px !important;
  }
  .maplibregl-ctrl-group button:hover {
    background: var(--theme-elevated) !important;
  }
  .maplibregl-ctrl-group button span {
    filter: invert(1) brightness(0.6);
  }
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
`;

export default function WellExplorer() {
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
    containerRef: mapContainerRef as React.RefObject<HTMLDivElement>,
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
            "var(--spacing-rt-shell-top) var(--spacing-rt-shell-sub) 1fr auto",
        }}
      >
        <UniversalTopbar />

        <Subheader
          query={query}
          onQueryChange={setQuery}
          activeType={activeType}
          onTypeChange={setActiveType}
          total={WELLS.length}
          filtered={filteredWells.length}
        />

        <div className="relative flex overflow-hidden">
          <div
            ref={mapContainerRef}
            className="flex-1 h-full"
            style={{ background: "#0f1214" }}
          />

          {selectedWell && (
            <DetailPanel
              well={selectedWell}
              onClose={() => setSelectedWell(null)}
            />
          )}

          <MapOverlay coords={coords} />

          <Sidebar
            wells={filteredWells}
            selectedId={selectedWell?.id ?? null}
            onSelectWell={handleSidebarSelect}
          />
        </div>

        <Footer />
      </div>
    </>
  );
}
