import { metricOk, metricUnavailable, type MetricValue } from "@/lib/types";

export type WellStatus = "drilling" | "standby" | "offline";
export type WellType = "production" | "injection" | "delineation";
export type WellPhase =
  | "drilling"
  | "completion"
  | "producing"
  | "injecting"
  | "shut-in";

interface WellBase {
  id: string;
  name: string;
  padId: string;
  wellType: WellType;
  status: WellStatus;
  lat: number;
  lon: number;
  operator: MetricValue<string>;
  spud: string;
  targetDepth: string;
  field: string;
  region: string;
}

type ProductionFlowFields = {
  temperature: string;
  flowRate: string;
  pressure: string;
};

export type Well =
  | (WellBase & ProductionFlowFields & { phase: "producing" | "injecting" })
  | (WellBase & {
      phase: "drilling";
      currentDepth: string;
      rop: string;
      daysOnWell: number;
    })
  | (WellBase & { phase: "completion" | "shut-in" });

const FIELD = "Guntur Geothermal";
const REGION = "Garut, West Java";

export const WELLS: Well[] = [
  // Pad A — Guntur Wellpad (6 wells)
  { id: "ga-01", name: "PROD-GA-01", padId: "pad-a", wellType: "production", status: "drilling", phase: "drilling", lat: -7.2952, lon: 107.6948, operator: metricOk("Ahmad R."), spud: "Mar 12, 2025", targetDepth: "2,800 m", field: FIELD, region: REGION, currentDepth: "2,634 m", rop: "6.6 m/hr", daysOnWell: 55 },
  { id: "ga-02", name: "PROD-GA-02", padId: "pad-a", wellType: "production", status: "drilling", phase: "drilling", lat: -7.2955, lon: 107.6952, operator: metricOk("Dwi S."), spud: "Jan 28, 2025", targetDepth: "2,650 m", field: FIELD, region: REGION, currentDepth: "2,512 m", rop: "5.4 m/hr", daysOnWell: 98 },
  { id: "ga-03", name: "PROD-GA-03", padId: "pad-a", wellType: "production", status: "standby", phase: "completion", lat: -7.2948, lon: 107.6955, operator: metricUnavailable(), spud: "TBD", targetDepth: "2,750 m", field: FIELD, region: REGION },
  { id: "ga-04", name: "INJ-GA-01", padId: "pad-a", wellType: "injection", status: "drilling", phase: "drilling", lat: -7.2958, lon: 107.6945, operator: metricOk("Budi H."), spud: "Feb 15, 2025", targetDepth: "1,900 m", field: FIELD, region: REGION, currentDepth: "1,742 m", rop: "7.2 m/hr", daysOnWell: 80 },
  { id: "ga-05", name: "INJ-GA-02", padId: "pad-a", wellType: "injection", status: "offline", phase: "shut-in", lat: -7.2945, lon: 107.6958, operator: metricUnavailable(), spud: "TBD", targetDepth: "2,100 m", field: FIELD, region: REGION },
  { id: "ga-06", name: "DEL-GA-01", padId: "pad-a", wellType: "delineation", status: "standby", phase: "completion", lat: -7.2962, lon: 107.6960, operator: metricUnavailable(), spud: "TBD", targetDepth: "3,200 m", field: FIELD, region: REGION },

  // Pad B — Talpad Wellpad (4 wells)
  { id: "gb-01", name: "PROD-GB-01", padId: "pad-b", wellType: "production", status: "drilling", phase: "drilling", lat: -7.2882, lon: 107.6878, operator: metricOk("Rina P."), spud: "Apr 2, 2025", targetDepth: "2,400 m", field: FIELD, region: REGION, currentDepth: "2,180 m", rop: "5.9 m/hr", daysOnWell: 34 },
  { id: "gb-02", name: "PROD-GB-02", padId: "pad-b", wellType: "production", status: "standby", phase: "completion", lat: -7.2878, lon: 107.6885, operator: metricUnavailable(), spud: "TBD", targetDepth: "2,300 m", field: FIELD, region: REGION },
  { id: "gb-03", name: "INJ-GB-01", padId: "pad-b", wellType: "injection", status: "drilling", phase: "drilling", lat: -7.2885, lon: 107.6882, operator: metricOk("Yanto K."), spud: "May 10, 2025", targetDepth: "1,700 m", field: FIELD, region: REGION, currentDepth: "1,524 m", rop: "8.1 m/hr", daysOnWell: 18 },
  { id: "gb-04", name: "DEL-GB-01", padId: "pad-b", wellType: "delineation", status: "offline", phase: "shut-in", lat: -7.2890, lon: 107.6870, operator: metricUnavailable(), spud: "TBD", targetDepth: "2,900 m", field: FIELD, region: REGION },

  // Pad C — North Ridge (2 wells)
  { id: "gc-01", name: "PROD-GC-01", padId: "pad-c", wellType: "production", status: "drilling", phase: "drilling", lat: -7.2802, lon: 107.6798, operator: metricOk("Sari M."), spud: "Jun 1, 2025", targetDepth: "2,100 m", field: FIELD, region: REGION, currentDepth: "1,896 m", rop: "6.0 m/hr", daysOnWell: 12 },
  { id: "gc-02", name: "DEL-GC-01", padId: "pad-c", wellType: "delineation", status: "standby", phase: "completion", lat: -7.2795, lon: 107.6805, operator: metricUnavailable(), spud: "TBD", targetDepth: "3,500 m", field: FIELD, region: REGION },
];

export function getWellName(id: string): string {
  const well = WELLS.find((w) => w.id === id);
  if (!well) {
    throw new Error(`Well with id "${id}" not found`);
  }
  return well.name;
}

export function getWellById(id: string): Well | undefined {
  return WELLS.find((w) => w.id === id);
}

export const LIVE_WELL_ID = "ga-01";
