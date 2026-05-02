export type WellStatus = "drilling" | "standby" | "offline";
export type WellType = "production" | "injection" | "delineation";

export interface Well {
  id: string;
  name: string;
  padId: string;
  wellType: WellType;
  status: WellStatus;
  lat: number;
  lon: number;
  temperature: string;
  flowRate: string;
  pressure: string;
  operator: string;
  spud: string;
  targetDepth: string;
  block?: string;
  region?: string;
}

export const WELLS: Well[] = [
  // Pad A — Guntur Wellpad (6 wells)
  { id: "ga-01", name: "PROD-GA-01", padId: "pad-a", wellType: "production", status: "drilling", lat: -7.2952, lon: 107.6948, temperature: "220°C", flowRate: "450 t/h", pressure: "18.5 bar", operator: "Ahmad R.", spud: "Mar 12, 2025", targetDepth: "2,800 m" },
  { id: "ga-02", name: "PROD-GA-02", padId: "pad-a", wellType: "production", status: "drilling", lat: -7.2955, lon: 107.6952, temperature: "215°C", flowRate: "420 t/h", pressure: "17.8 bar", operator: "Dwi S.", spud: "Jan 28, 2025", targetDepth: "2,650 m" },
  { id: "ga-03", name: "PROD-GA-03", padId: "pad-a", wellType: "production", status: "standby", lat: -7.2948, lon: 107.6955, temperature: "218°C", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "2,750 m" },
  { id: "ga-04", name: "INJ-GA-01", padId: "pad-a", wellType: "injection", status: "drilling", lat: -7.2958, lon: 107.6945, temperature: "85°C", flowRate: "380 t/h", pressure: "12.2 bar", operator: "Budi H.", spud: "Feb 15, 2025", targetDepth: "1,900 m" },
  { id: "ga-05", name: "INJ-GA-02", padId: "pad-a", wellType: "injection", status: "offline", lat: -7.2945, lon: 107.6958, temperature: "—", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "2,100 m" },
  { id: "ga-06", name: "DEL-GA-01", padId: "pad-a", wellType: "delineation", status: "standby", lat: -7.2962, lon: 107.6960, temperature: "—", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "3,200 m" },

  // Pad B — Talpad Wellpad (4 wells)
  { id: "gb-01", name: "PROD-GB-01", padId: "pad-b", wellType: "production", status: "drilling", lat: -7.2882, lon: 107.6878, temperature: "210°C", flowRate: "390 t/h", pressure: "16.4 bar", operator: "Rina P.", spud: "Apr 2, 2025", targetDepth: "2,400 m" },
  { id: "gb-02", name: "PROD-GB-02", padId: "pad-b", wellType: "production", status: "standby", lat: -7.2878, lon: 107.6885, temperature: "205°C", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "2,300 m" },
  { id: "gb-03", name: "INJ-GB-01", padId: "pad-b", wellType: "injection", status: "drilling", lat: -7.2885, lon: 107.6882, temperature: "90°C", flowRate: "340 t/h", pressure: "11.8 bar", operator: "Yanto K.", spud: "May 10, 2025", targetDepth: "1,700 m" },
  { id: "gb-04", name: "DEL-GB-01", padId: "pad-b", wellType: "delineation", status: "offline", lat: -7.2890, lon: 107.6870, temperature: "—", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "2,900 m" },

  // Pad C — North Ridge (2 wells)
  { id: "gc-01", name: "PROD-GC-01", padId: "pad-c", wellType: "production", status: "drilling", lat: -7.2802, lon: 107.6798, temperature: "195°C", flowRate: "310 t/h", pressure: "14.2 bar", operator: "Sari M.", spud: "Jun 1, 2025", targetDepth: "2,100 m" },
  { id: "gc-02", name: "DEL-GC-01", padId: "pad-c", wellType: "delineation", status: "standby", lat: -7.2795, lon: 107.6805, temperature: "—", flowRate: "—", pressure: "—", operator: "—", spud: "TBD", targetDepth: "3,500 m" },
];

export function getWellName(id: string): string {
  return WELLS.find((w) => w.id === id)?.name ?? "Unknown Well";
}

export function getWellById(id: string): Well | undefined {
  return WELLS.find((w) => w.id === id);
}
