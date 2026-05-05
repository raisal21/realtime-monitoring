import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Well } from "@/data/wells";
import { WELLS } from "@/data/wells";
import { MAP_STYLE, BLOCK_BOUNDARY, PAD_BOUNDARIES, WELL_TYPE_COLOR } from "../lib/constants";
import { buildCollisionLines, buildWellsGeoJSON, buildPopupHTML } from "../lib/utils";

interface UseMaplibreParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  wells: Well[];
  onSelectWell: (well: Well) => void;
}

export function useMaplibre({ containerRef, wells, onSelectWell }: UseMaplibreParams) {
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
