function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function getChartColors() {
  return {
    base:         getCssVar("--theme-base"),
    surface:      getCssVar("--theme-surface"),
    elevated:     getCssVar("--theme-elevated"),
    fg:           getCssVar("--theme-fg"),
    fgMuted:      getCssVar("--theme-fg-muted"),
    fgDim:        getCssVar("--theme-fg-dim"),
    border:       getCssVar("--theme-border"),
    borderSubtle: getCssVar("--theme-border-subtle"),
    ok:           getCssVar("--theme-ok"),
    warning:      getCssVar("--theme-warning"),
    critical:     getCssVar("--theme-critical"),
    info:         getCssVar("--theme-info"),
    accent:       getCssVar("--theme-accent"),
    accentDim:    getCssVar("--theme-accent-dim"),
  };
}

export function getTraceColors() {
  return {
    rpm:    getCssVar("--trace-rpm"),
    wob:    getCssVar("--trace-wob"),
    torque: getCssVar("--trace-torque"),
    spp:    getCssVar("--trace-spp"),
    hkld:   getCssVar("--trace-hkld"),
    gamma:  getCssVar("--trace-gamma"),
    rop:    getCssVar("--trace-rop"),
    h2s:    getCssVar("--trace-h2s"),
    inc:    getCssVar("--trace-inc"),
    azi:    getCssVar("--trace-azi"),
  };
}

