// Unit-system conversions. Canonical data = metric. Convert at render boundary.

export type UnitSystem = "metric" | "imperial";

const FT_PER_M = 1 / 0.3048;
const KLBS_PER_KN = 1 / 4.4482216;
const PSI_PER_BAR = 1 / 0.0689476;

export const ftToM = (ft: number) => ft * 0.3048;
export const mToFt = (m: number) => m * FT_PER_M;
export const klbsToKN = (klbs: number) => klbs * 4.4482216;
export const kNToKlbs = (kN: number) => kN * KLBS_PER_KN;
export const psiToBar = (psi: number) => psi * 0.0689476;
export const barToPsi = (bar: number) => bar * PSI_PER_BAR;
export const ftHrToMHr = (v: number) => v * 0.3048;
export const mHrToFtHr = (v: number) => v * FT_PER_M;

export interface FormatOptions {
  fractionDigits?: number;
}

function fmt(n: number, digits = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Source = canonical metric. Imperial-selected → convert.

export function formatDepth(
  meters: number,
  system: UnitSystem,
  opts: FormatOptions = {},
): { value: string; unit: string } {
  if (system === "imperial") {
    return { value: fmt(mToFt(meters), opts.fractionDigits ?? 0), unit: "ft" };
  }
  return { value: fmt(meters, opts.fractionDigits ?? 0), unit: "m" };
}

export function formatRop(
  mPerHr: number,
  system: UnitSystem,
  opts: FormatOptions = {},
): { value: string; unit: string } {
  if (system === "imperial") {
    return {
      value: fmt(mHrToFtHr(mPerHr), opts.fractionDigits ?? 1),
      unit: "ft/hr",
    };
  }
  return { value: fmt(mPerHr, opts.fractionDigits ?? 1), unit: "m/hr" };
}

export function formatLoad(
  kN: number,
  system: UnitSystem,
  opts: FormatOptions = {},
): { value: string; unit: string } {
  if (system === "imperial") {
    return {
      value: fmt(kNToKlbs(kN), opts.fractionDigits ?? 1),
      unit: "klbs",
    };
  }
  return { value: fmt(kN, opts.fractionDigits ?? 0), unit: "kN" };
}

export function formatPressure(
  bar: number,
  system: UnitSystem,
  opts: FormatOptions = {},
): { value: string; unit: string } {
  if (system === "imperial") {
    return {
      value: fmt(barToPsi(bar), opts.fractionDigits ?? 0),
      unit: "psi",
    };
  }
  return { value: fmt(bar, opts.fractionDigits ?? 1), unit: "bar" };
}

export function joinValueUnit(parts: { value: string; unit: string }): string {
  return `${parts.value} ${parts.unit}`;
}
