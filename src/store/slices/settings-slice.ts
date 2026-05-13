import type { StateCreator } from "zustand";
import type { UnitSystem } from "@/lib/units";
import type { GlobalRigState } from "../store.types";

export type Theme = "gruvbox" | "tomorrow" | "solarized";
export type Density = "compact" | "comfortable";
export type FontSize = "sm" | "md" | "lg";
export type SampleRate = "10hz" | "5hz" | "1hz";

// Mirror of --fs-scale in index.css. Canvas/SVG renderers consume it
// to keep numeric labels aligned with CSS-driven text.
export const FS_SCALE: Record<FontSize, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.12,
};

type SettingsState = {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  sampleRate: SampleRate;
  smoothing: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  unitSystem: UnitSystem;
};

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setFontSize: (size: FontSize) => void;
  setSampleRate: (rate: SampleRate) => void;
  toggleSmoothing: () => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
  setUnitSystem: (system: UnitSystem) => void;
}

export interface SettingsSlice extends SettingsActions {
  settings: SettingsState;
}

// One-shot lift of pre-Phase-10 standalone localStorage keys into the
// consolidated `rtdc-store` payload. Runs at module init; legacy keys are
// removed so the next load reads only from persist middleware.
function liftLegacyUnitSystem(): UnitSystem {
  if (typeof localStorage === "undefined") return "metric";
  const v = localStorage.getItem("rtdc.unitSystem");
  localStorage.removeItem("rtdc.unitSystem");
  return v === "imperial" || v === "metric" ? v : "metric";
}

const settingsInitial: SettingsState = {
  theme: "gruvbox",
  density: "comfortable",
  fontSize: "md",
  sampleRate: "10hz",
  smoothing: false,
  soundEnabled: true,
  notificationsEnabled: true,
  unitSystem: liftLegacyUnitSystem(),
};

export const createSettingsSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  settings: settingsInitial,

  setTheme: (theme) =>
    set((s) => ({ settings: { ...s.settings, theme } })),

  setDensity: (density) =>
    set((s) => ({ settings: { ...s.settings, density } })),

  setFontSize: (size) =>
    set((s) => ({ settings: { ...s.settings, fontSize: size } })),

  setSampleRate: (rate) =>
    set((s) => ({ settings: { ...s.settings, sampleRate: rate } })),

  toggleSmoothing: () =>
    set((s) => ({
      settings: { ...s.settings, smoothing: !s.settings.smoothing },
    })),

  toggleSound: () =>
    set((s) => ({
      settings: { ...s.settings, soundEnabled: !s.settings.soundEnabled },
    })),

  toggleNotifications: () =>
    set((s) => ({
      settings: {
        ...s.settings,
        notificationsEnabled: !s.settings.notificationsEnabled,
      },
    })),

  setUnitSystem: (system) =>
    set((s) => ({ settings: { ...s.settings, unitSystem: system } })),
});
