import type { StyleSpecification } from "maplibre-gl";
import type { Well } from "@/data/wells";

export const MAP_STYLE: StyleSpecification = {
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

export const BLOCK_BOUNDARY: GeoJSON.FeatureCollection = {
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

export const PAD_BOUNDARIES: GeoJSON.FeatureCollection = {
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

export const WELL_TYPE_COLOR: Record<Well["wellType"], string> = {
  production: "#b8bb26",
  injection: "#83a598",
  delineation: "#fabd2f",
};

export const WELL_TYPE_LABEL: Record<Well["wellType"], string> = {
  production: "Production",
  injection: "Injection",
  delineation: "Delineation",
};

export const STATUS_LABEL: Record<Well["status"], string> = {
  drilling: "Drilling",
  standby: "Standby",
  offline: "Offline",
};

export const STATUS_DOT: Record<Well["status"], "ok" | "warning" | "inactive"> = {
  drilling: "ok",
  standby: "warning",
  offline: "inactive",
};
