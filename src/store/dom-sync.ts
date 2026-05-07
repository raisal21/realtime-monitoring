// Module-level DOM sync for settings. Runs at import time so
// `<html data-theme=... data-font-size=... data-density=...>` is wired
// before any React mount, regardless of provider tree.
//
// Replaces the side-effects previously housed inside `SettingsProvider`
// (Phase 10.c — provider removed from layouts).

import { globalRigStore } from "./index-store";

function applyDataset(theme: string, fontSize: string, density: string) {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.dataset.theme = theme;
  r.dataset.fontSize = fontSize;
  r.dataset.density = density;
}

const initial = globalRigStore.getState().settings;
applyDataset(initial.theme, initial.fontSize, initial.density);

globalRigStore.subscribe((state, prev) => {
  if (state.settings === prev.settings) return;
  const { theme, fontSize, density } = state.settings;
  applyDataset(theme, fontSize, density);

  // Brief transition class smooths theme palette swap. Skipped on
  // initial paint (no prior theme to transition from).
  if (theme !== prev.settings.theme && typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    window.setTimeout(
      () => root.classList.remove("theme-transitioning"),
      320,
    );
  }
});
