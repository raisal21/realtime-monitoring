export interface Pad {
  id: string;
  name: string;
  shortName: string;
  field: string;
  centroid: { lat: number; lon: number };
}

export const PADS: Record<string, Pad> = {
  "pad-a": {
    id: "pad-a",
    name: "Guntur Wellpad",
    shortName: "Guntur",
    field: "Guntur Geothermal",
    centroid: { lat: -7.2955, lon: 107.6952 },
  },
  "pad-b": {
    id: "pad-b",
    name: "Talpad Wellpad",
    shortName: "Talpad",
    field: "Guntur Geothermal",
    centroid: { lat: -7.2883, lon: 107.6879 },
  },
  "pad-c": {
    id: "pad-c",
    name: "North Ridge",
    shortName: "North Ridge",
    field: "Guntur Geothermal",
    centroid: { lat: -7.2800, lon: 107.6800 },
  },
};

export const PAD_NAMES: Record<string, string> =
  Object.fromEntries(Object.entries(PADS).map(([k, v]) => [k, v.shortName]));
