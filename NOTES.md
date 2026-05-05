---
id: 2026-05-05
aliases: []
tags:
  - daily-notes
  - architecture
  - domain-decision
  - geothermal
---

# Realtime Telemetry — Domain Commitment & Refactor Plan

## Domain Decision: GEOTHERMAL

Project commits to **geothermal drilling/production** as single domain. All
oil & gas naming, units, and locations must be replaced or reframed.

### Why geothermal

- `WELLS` data already geothermal-shaped: production + injection pattern,
  units °C / t/h (steam mass flow) / bar, coordinates at Mt. Guntur (Garut,
  West Java) — a real Indonesian geothermal field.
- Map (MapLibre + terrain DEM) already centered on Guntur volcanic terrain.
- Pad naming (Guntur / Talpad / North Ridge) reads as geothermal field
  layout, not offshore O&G blocks.

### Domain consistency rule

Drilling-phase traces (RPM, WOB, torque, SPP, HKLD, gamma, ROP, INC, AZI)
are **domain-agnostic** — same drilling mechanics apply to oil, gas, and
geothermal wells. These stay. What changes:

- `GAS%` trace → replace with `H2S ppm` or `MUD TEMP OUT` (geothermal
  cares about H₂S safety + thermal gradient, not hydrocarbon kick gas).
- Units: ft → m, klbs → kN, psi → bar (or expose unit-system toggle in
  Settings).
- Production-phase sidebar metrics (temp/flow/press) only valid when
  `status` is producing — must not show for `status="drilling"`.

---

## Root Cause: Two Domains Glued Together

Project currently mixes two incompatible domains:

| Layer                                              | Current domain    | Evidence                                                            |
| -------------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `src/data/wells.ts` + map (`constants.ts`)         | Geothermal        | Mt. Guntur coords, °C / t/h / bar, prod+inj wells, depths in meters |
| `src/data/dashboard-static.ts` (`CURRENT_WELL`)    | Offshore O&G      | "Block 7G", "Makassar Strait", ft / klbs / psi, GAS% trace          |
| `AuthCard.tsx`                                     | Mixed hardcoded   | "Alpha-1 · Pad Guntur" (alpha-1 = O&G naming, Guntur = geothermal)  |

`CURRENT_WELL.region="Makassar Strait"` (offshore Borneo O&G) +
`WELLS` at Mt. Guntur (West Java geothermal volcano) = contradiction.

`CURRENT_WELL.id="alpha-1"` not present in `WELLS` array → `getWellName()`
returns `"Unknown Well"` everywhere downstream.

---

## Architectural Fix: Replace `CURRENT_WELL` Constant

`CURRENT_WELL` is a stale singleton. Real fix is context-driven well
lookup, not patching string mismatches.

### Plan

1. Delete `CURRENT_WELL` from `src/data/dashboard-static.ts`.
2. Add `CurrentWellProvider` (React Context) at app root.
   - Seeded from route param `:wellId` (e.g. `/dashboard/:wellId`,
     `/wells/:wellId`).
   - Falls back to first `WELLS` entry (`ga-01`) if no param.
   - Provides full `Well` object, not just id.
3. Migrate consumers to context:
   - `Footer.tsx` — read `well.name` from context.
   - `UniversalTopbar.tsx` — drop `CURRENT_WELL.id` fallback; use context.
   - `DashboardSubheader.tsx` — derive pad name + region from context
     (`PAD_NAMES[well.padId]`), drop `padNames` literal.
   - `AuthCard.tsx` — replace hardcoded "Alpha-1 · Pad Guntur" with
     context value or static "Guntur Field · Garut, West Java".
4. `WellExplorerLayout.tsx` — pass selected `wellId` to `UniversalTopbar`
   so breadcrumb shows `Wells > [PROD-GA-01]`, not `Wells > Wells`.

---

## Data Model Cleanups

### `src/data/wells.ts`

- Add `region: "Garut, West Java"` and `field: "Guntur Geothermal"` as
  defaults at field level (or per-well if multi-field expected).
- Optionally extend `Well` with `phase: "drilling" | "producing"` so
  sidebar metrics can branch deterministically rather than overloading
  `status`.

### `src/data/dashboard-static.ts`

- Remove `CURRENT_WELL`.
- Rename / repurpose `GAS` gauge + `gas` trace:
  - Option A: `H2S` (ppm), critical safety trace for geothermal.
  - Option B: `MUD TEMP OUT` (°C), thermal gradient indicator.
- Convert units to metric:
  - depths: ft → m (`SESSION_DEPTH_START_FT`/`END_FT` → metric, ~4250 m
    → ~4630 m for Guntur reservoir target).
  - HKLD klbs → kN.
  - SPP psi → bar.
  - WOB klbs → kN (or tonnes-force).
  - ROP ft/hr → m/hr.
- `TICKER_NOMINAL_ENTRIES` — rewrite to geothermal context:
  - `Well: PROD-GA-01 · Pad Guntur`
  - `Depth: 4,630 m MD`
  - `ROP: 6.6 m/hr`
  - `WHT: 220°C` (wellhead temperature, post-completion)

### `src/components/well-explorer/lib/constants.ts`

- `BLOCK_BOUNDARY` → rename to `FIELD_BOUNDARY` or `CONCESSION_BOUNDARY`.
  Curved polygon is realistic for geothermal concessions (follows
  terrain/lease lines, not rectangular grids). Keep shape, fix name.
- Property `name: "Block 7G"` → `name: "Guntur Geothermal Field"`.

---

## Component-Level Fixes

### 1. `ExplorerSidebar.tsx` — status-aware metrics

Current: shows temp/flow/press for `status="drilling"`. Contradictory —
drilling well has no production output yet.

Fix branch by status (or add `phase` field):

```tsx
metrics={
  w.status === "drilling"
    ? [
        { key: "Depth",  value: w.currentDepth ?? "—" },
        { key: "ROP",    value: w.rop ?? "—" },
        { key: "Days",   value: w.daysOnWell ?? "—" },
      ]
    : w.status === "standby" || w.status === "offline"
    ? [{ key: "TD Target", value: w.targetDepth }]
    : [
        { key: "Temp",  value: w.temperature },
        { key: "Flow",  value: w.flowRate },
        { key: "Press", value: w.pressure },
      ]
}
```

Requires adding `currentDepth`, `rop`, `daysOnWell` to `Well` type for
drilling wells (or computing from session data).

### 2. `UniversalTopbar.tsx` — breadcrumb

- Drop `CURRENT_WELL.id` fallback (line 31).
- Read active well from `CurrentWellProvider`.
- WellExplorer route: when no well selected, breadcrumb = `Wells` only
  (no trailing `> Wells`). When selected, `Wells > [well.name]`.

### 3. `DashboardSubheader.tsx`

- Drop local `padNames` literal — import `PAD_NAMES` from
  `well-explorer/sidebar/PadMap.ts` to remove duplication.
- Display: `{well.name} · {PAD_NAMES[well.padId]} · Garut, West Java`.

### 4. `Footer.tsx`

- Replace `CURRENT_WELL.name` with context value.
- Format: `RTDC v0.2.0-alpha · {well.name} · Guntur Field · © 2026`.

### 5. `AuthCard.tsx` (line 68)

- Replace `"Alpha-1 · Pad Guntur"` with `"Guntur Geothermal Field · Garut, West Java"`.

### 6. `SettingsPopover.tsx` ToggleGroup active state

Independent bug — orthogonal to domain refactor.

- `src/components/core.tsx` (lines 346-382): `ToggleGroup` likely missing
  `type="single"` + controlled `value`/`onValueChange` wiring.
- Symptoms: Density (Compact/Comfort) and Font Size (SM/MD/LG) toggles
  do not show active option.
- Fix: ensure single-select semantics + bind to `useSettings()` state.

---

## Future Work

1. Add unit-system setting (Imperial vs Metric) — toggle in
   SettingsPopover. Geothermal default = Metric.
2. Add `phase` field to `Well` (`drilling` | `completion` | `producing`
   | `injecting` | `shut-in`) — clean separation from `status`
   (operational state).
3. Replace `gas` trace + gauge with `H2S` (recommended) or `MUD TEMP OUT`.
   Update `TRACK_TRACES.geo`, `GAUGES`, `generateSession()` accordingly.
4. Reconcile depth units in `WELL_PROFILE_DATA` and `SESSION_RANGE` to
   metric. Keep one constant as canonical to avoid drift.
5. Wire route param `:wellId` for `/dashboard/:wellId` and
   `/wells/:wellId`. Update `App.tsx` routing.
6. Backfill drilling-phase metrics (`currentDepth`, `rop`, `daysOnWell`)
   on `Well` records with `status="drilling"`.

---

## Out of Scope (for this refactor)

- WebSocket protocol changes (`StreamDef.DRILL`/`GEO` IDs) — binary
  parser stays as-is; only display semantics change.
- Theme/density/fontSize logic.
- Map tile sources or terrain DEM.

---

# Execution Plan — Phased Rollout

Ordered phases, each shippable independently. Risk grades: **L** low /
**M** medium / **H** high. Estimated touch = file count.

## Phase 0 — Layout/Shell Refactor (DONE 2026-05-06)

Status: complete. Captured here for traceability.

- Deleted `AuthLayout.tsx`, `DashboardLayout.tsx`, `WellExplorerLayout.tsx`.
  Bodies absorbed into `pages/Auth.tsx`, `pages/Dashboard.tsx`,
  `pages/WellExplorer.tsx`.
- Moved `UniversalTopbar` from `components/dashboard/shell/` to
  `components/shell/`. Distinct from `ui/` primitives, distinct from
  feature-specific `dashboard/shell/`.
- Added `CurrentWellProvider` (`src/contexts/CurrentWellContext.tsx`)
  seeded from route param `:wellId`, fallback `WELLS[0]`.
- Routes wire `:wellId` → provider in `src/routes.tsx`. Routes:
  `/dashboard/:wellId?`, `/wells/:wellId?`.
- Dropped `wellId` prop chain. `Dashboard.tsx` no props,
  `UniversalTopbar` reads from `useOptionalCurrentWell()` + `useParams`.
  `WellExplorer.tsx` wraps inner `CurrentWellProvider` keyed on
  `selectedWell?.id` so topbar breadcrumb tracks selection.

## Phase 1 — Domain Cleanup Verification & Finish (DONE 2026-05-06)

**Risk: L** · **Touch: ~6 files** · **Ship: solo**

Per `git status` several files already modified. Verify each matches
NOTES.md spec, finish remaining gaps.

### 1.1 `src/data/dashboard-static.ts`

- [ ] `CURRENT_WELL` constant deleted (no consumers left).
- [ ] `TICKER_NOMINAL_ENTRIES` rewritten:
  - `Well: PROD-GA-01 · Pad Guntur`
  - `Depth: 4,630 m MD`
  - `ROP: 6.6 m/hr`
  - `WHT: 220°C`
- [ ] `SESSION_DEPTH_START_FT` / `END_FT` constants — defer rename to
  Phase 6 (depth reconcile) unless trivial.

### 1.2 `src/components/well-explorer/lib/constants.ts`

- [ ] `BLOCK_BOUNDARY` renamed to `FIELD_BOUNDARY` (or
  `CONCESSION_BOUNDARY`). Geometry unchanged.
- [ ] `name: "Block 7G"` → `name: "Guntur Geothermal Field"`.
- [ ] All importers updated.

### 1.3 `src/components/dashboard/shell/Footer.tsx`

- [ ] Reads `well.name` via `useCurrentWell()`. No `CURRENT_WELL` import.
- [ ] Format: `RTDC v0.2.0-alpha · {well.name} · Guntur Field · © 2026`.

### 1.4 `src/components/dashboard/shell/DashboardSubheader.tsx`

- [ ] Reads `well` via `useCurrentWell()`.
- [ ] Imports `PAD_NAMES` from `well-explorer/sidebar/PadMap.ts` —
  drops local `padNames` literal.
- [ ] Display: `{well.name} · {PAD_NAMES[well.padId]} · Garut, West Java`.

### 1.5 `src/components/auth/AuthCard.tsx`

- [ ] Hardcoded `"Alpha-1 · Pad Guntur"` (line 68 ref) replaced with
  static `"Guntur Geothermal Field · Garut, West Java"`. Auth has no
  selected well, so static is correct.

### 1.6 `src/components/dashboard/popovers/SettingsPopover.tsx` + `src/components/core.tsx`

- [ ] `ToggleGroup` (core.tsx 346-382) — `type="single"`, controlled
  `value` + `onValueChange` props honored.
- [ ] Density (Compact/Comfort) and Font Size (SM/MD/LG) wired to
  `useSettings()` state. Active option visually distinct.
- [ ] Manual test: click each option, confirm state updates + persists.

### Acceptance criteria

- `grep -r "CURRENT_WELL" src/` returns zero.
- `grep -r "Alpha-1\|Block 7G\|Makassar" src/` returns zero.
- All breadcrumbs/footers show `getWellName(well.id)` not
  `"Unknown Well"`.

---

## Phase 2 — `Well` Type Extension (DONE 2026-05-06)

**Risk: M** · **Touch: ~4 files (type + data + 2 consumers)** · **Ship: solo**

Foundation for Phase 3.

### 2.1 Type changes — `src/data/wells.ts`

```ts
export type WellPhase =
  | "drilling"
  | "completion"
  | "producing"
  | "injecting"
  | "shut-in";

export interface Well {
  // existing fields...
  phase: WellPhase;          // NEW — operational lifecycle stage
  currentDepth?: number;     // NEW — m MD, drilling/completion only
  rop?: number;              // NEW — m/hr, drilling only
  daysOnWell?: number;       // NEW — drilling only
  field: string;             // NEW — default "Guntur Geothermal"
  region: string;            // NEW — default "Garut, West Java"
}
```

### 2.2 Backfill `WELLS` array

- All records get `field`, `region` defaults.
- Records with `status="drilling"` get `phase="drilling"` +
  realistic `currentDepth`, `rop`, `daysOnWell`.
- Producing wells: `phase="producing"`. Injection: `phase="injecting"`.
- Standby/offline: `phase="shut-in"` or `"completion"` based on context.

### 2.3 `status` vs `phase` rule

- `status` = operational state (online/offline/alarm/standby) — UI signal
- `phase` = lifecycle stage — data model
- Both retained. Sidebar branches on `phase` (Phase 3).

### Acceptance criteria

- `tsc -b` clean.
- All `WELLS` entries have `field`, `region`, `phase`.
- Optional drilling fields populated only where `phase === "drilling"`.

---

## Phase 3 — Status/Phase-Aware Sidebar (DONE 2026-05-06)

**Risk: L** · **Touch: 1 file** · **Depends: Phase 2**

### 3.1 `src/components/well-explorer/sidebar/ExplorerSidebar.tsx`

Branch metrics by `well.phase`:

```tsx
metrics={
  w.phase === "drilling"
    ? [
        { key: "Depth", value: w.currentDepth ?? "—" },
        { key: "ROP",   value: w.rop ?? "—" },
        { key: "Days",  value: w.daysOnWell ?? "—" },
      ]
    : w.phase === "shut-in" || w.phase === "completion"
    ? [{ key: "TD Target", value: w.targetDepth }]
    : [
        { key: "Temp",  value: w.temperature },
        { key: "Flow",  value: w.flowRate },
        { key: "Press", value: w.pressure },
      ]
}
```

### Acceptance criteria

- Drilling well row shows Depth/ROP/Days.
- Producing well row shows Temp/Flow/Press.
- Shut-in/completion shows TD Target.
- No `undefined` rendered — fall back to `"—"`.

---

## Phase 4 — Trace Replacement: `gas` → `H2S` (DONE 2026-05-06)

**Risk: M** · **Touch: ~6 files** · **Ship: solo**

H₂S ppm chosen over MUD TEMP OUT — safety-critical for geothermal,
direct geothermal-domain analog to O&G `GAS%`.

### 4.1 Static config — `src/data/dashboard-static.ts`

- `TRACK_TRACES.geo` — rename key `gas` → `h2s`, update label, units (ppm).
- `GAUGES` config — replace `GAS` entry with `H2S`:
  - `label: "H2S"`, `units: "ppm"`, range e.g. `0-50` ppm
  - alarm thresholds (e.g. >10 ppm warning, >20 ppm critical)
- Color tokens — assign theme color (suggest amber/red gradient,
  distinct from existing traces).

### 4.2 Session generator — `src/data/dashboard-static.ts` or generator file

- `generateSession()` emits `h2s` values 0-15 ppm typical, occasional
  spikes for alarm testing.

### 4.3 Binary protocol — `src/services/binary-parser.ts`

- `StreamDef.GEO` byte layout — verify field at `gas` offset still
  decodes; rename only the JS property name, not the wire format.
  Wire format change is out of scope (NOTES.md).

### 4.4 Domain types — `src/domain/message.types.ts`, `message.schema.ts`

- Rename Zod field, type field, regenerate.

### 4.5 Components consuming `gas`

- `grep -rn "\.gas\b\|'gas'\|\"gas\"\|gauges?\.gas" src/` — exhaustive
  rename pass.
- Update `GaugeCollapsedStrip`, `FloatingGaugeSidebar`, `LogTrack`
  configs.

### 4.6 Theme tokens

- If `--gas-*` CSS vars exist, alias or rename to `--h2s-*`.

### Acceptance criteria

- No `gas` identifier remains in `src/` (except domain-agnostic words).
- Gauge displays H2S with ppm units.
- Alarm fires when synthetic spike crosses threshold.
- Binary stream still parses without runtime errors.

---

## Phase 5 — Unit System Toggle (DONE 2026-05-06, depth axis only)

**Scope shipped**: foundation (`src/lib/units.ts`), `unitSystem` in
`SettingsState` w/ `localStorage` persistence (key `rtdc.unitSystem`),
`SettingsPopover` Metric/Imperial toggle row, depth-axis conversion in
`DashboardSubheader` (live readout), `DepthRuler` (axis+min/max+unit),
`FlowRuler` (depth tooltip), `LogTrack` (depth pointer label),
`WellProfileTrack` (tooltip+pointer+endLabel+TD footer).

**Deferred to Phase 5b**: gauge unit conversion (`GAUGES` const has
hardcoded `klbs`/`psi`/`ft/hr` strings; requires refactor to derive
unit + format value at render based on `unitSystem`). Trace `unit`
field in `TRACK_TRACES` similarly hardcoded.

**Risk: M-H** · **Touch: ~10 files (every numeric label)** · **Ship: solo**

### 5.1 New module — `src/lib/units.ts`

Pure conversion functions, no React:

```ts
export type UnitSystem = "metric" | "imperial";

export const ftToM   = (ft: number) => ft * 0.3048;
export const mToFt   = (m: number)  => m / 0.3048;
export const klbsToKN = (klbs: number) => klbs * 4.4482216;
export const kNToKlbs = (kN: number)   => kN / 4.4482216;
export const psiToBar = (psi: number) => psi * 0.0689476;
export const barToPsi = (bar: number) => bar / 0.0689476;
export const ftHrToMHr = (v: number) => v * 0.3048;
export const mHrToFtHr = (v: number) => v / 0.3048;

export function formatDepth(value: number, system: UnitSystem): string;
export function formatLoad(value: number, system: UnitSystem): string;
export function formatPressure(value: number, system: UnitSystem): string;
export function formatRop(value: number, system: UnitSystem): string;
```

### 5.2 Settings extension — `src/stores/dashboard-store.tsx`

- `SettingsState` add `unitSystem: UnitSystem` (default `"metric"`).
- Action `SET_UNIT_SYSTEM`.
- Persist to `localStorage` alongside existing settings.

### 5.3 Settings UI — `src/components/dashboard/popovers/SettingsPopover.tsx`

- Add `ToggleGroup` "Units": Metric / Imperial.
- Wire to `useSettings()`.

### 5.4 Apply at render boundary

Canonical data = metric. Convert only at display:

- `DepthRuler`, `WellProfileTrack` — depth labels via `formatDepth`.
- `LogTrack` — per-track unit-aware formatter.
- `Gauges` — `formatLoad`, `formatPressure`, `formatRop`.
- `AlarmTicker` — re-format numeric strings.
- `DashboardSubheader` — depth display.

### 5.5 Do NOT convert

- Binary stream payloads (wire format unchanged).
- Map coordinates (already lat/lon, system-agnostic).
- Time-domain values.

### Acceptance criteria

- Toggle in settings flips all displayed numeric units within one render.
- Refresh persists choice.
- No double-conversion bugs (data layer untouched).
- Default = metric on first load.

---

## Phase 6 — Depth Constants Reconcile (DONE 2026-05-06)

**Risk: L-M** · **Touch: ~3 files** · **Depends: Phase 5**

### 6.1 Canonical depth = metric

- `WELL_PROFILE_DATA` — convert all `ft` literals to `m`.
- `SESSION_RANGE` — metric.
- Rename `SESSION_DEPTH_START_FT` → `SESSION_DEPTH_START_M`,
  `_END_FT` → `_END_M`. Values converted.

### 6.2 Display via Phase 5 utilities

- All consumers reading these constants pass through `formatDepth`.

### 6.3 Verify

- Drilling session depth axis shows `4,200-4,650 m` by default,
  `13,780-15,255 ft` when imperial.
- No drift between `WELL_PROFILE_DATA` and `SESSION_RANGE`.

### Acceptance criteria

- One canonical depth constant per concept (target/start/end).
- All `_FT` suffixes removed.
- Visual parity with previous imperial display (within rounding).

---

## Phase 5b — Gauge & Trace Unit Propagation

**Risk: M** · **Touch: ~6 files** · **Depends: Phase 5, Phase 6**

Phase 5 covered depth axis. Phase 5b extends `unitSystem` to gauge
values + per-trace axis units (HKLD, SPP, ROP, WOB). Currently those
units are baked as string constants (`"klbs"`, `"psi"`, `"ft/hr"`) and
the displayed numeric values are pre-formatted strings.

### 5b.1 Refactor `GAUGES` schema — `src/data/dashboard-static.ts`

Current shape (excerpt):

```ts
{
  id: "spp",
  label: "SPP",
  value: "2,681",       // pre-formatted imperial string
  unit: "psi",          // imperial-only literal
  status: "ok"
}
```

Replace with a quantity descriptor that carries canonical metric value
+ a `kind` discriminator that maps to a `formatX` helper:

```ts
type Quantity =
  | { kind: "depth";    valueM: number }
  | { kind: "load";     valueKN: number }
  | { kind: "pressure"; valueBar: number }
  | { kind: "rop";      valueMHr: number }
  | { kind: "scalar";   value: number; unit: string };  // RPM, gAPI, °, ppm

interface GaugeConfig {
  id: string;
  label: string;
  quantity: Quantity;
  status: "ok" | "warning" | "critical";
}
```

Migrate each entry. Convert literal values to canonical metric using
the same factors as `units.ts`. Reference table:

| Gauge  | Old (imperial) | New canonical |
|--------|----------------|---------------|
| WOB    | 19.4 klbs      | valueKN: 86.3 |
| SPP    | 2,681 psi      | valueBar: 184.8 |
| HKLD   | 200.3 klbs     | valueKN: 891.0 |
| ROP    | 21.8 ft/hr     | valueMHr: 6.6 |
| RPM    | 120 rpm        | scalar (no convert) |
| Torque | 4.60 klbf·ft   | scalar (defer) |
| Gamma  | 47 gAPI        | scalar |
| H2S    | 5.1 ppm        | scalar |
| Inc    | 22.2°          | scalar |
| Azi    | 145°           | scalar |

Note: torque (klbf·ft → kN·m) requires its own `formatTorque` helper.
Add to `units.ts` if Phase 5b ships it, otherwise mark torque as
`scalar` with `unit: "klbf·ft"` and defer.

### 5b.2 New helper — `src/lib/units.ts`

Add `formatQuantity(q: Quantity, system: UnitSystem)` that dispatches
on `kind` and returns `{ value, unit }`. Centralises render logic so
gauge components don't branch on unit system themselves.

Optionally add `formatTorque(kNm, system)` returning `klbf·ft`/`kN·m`.

### 5b.3 Refactor `TRACK_TRACES` — `src/data/dashboard-static.ts`

Current shape:

```ts
{ trace: "spp", name: "SPP", min: 0, max: 3000, unit: "psi" }
```

Two options:

**Option A** — store canonical metric `min`/`max` + `kind`, derive
display `min`/`max`/`unit` at render via `formatQuantity`:

```ts
{ trace: "spp", name: "SPP", kind: "pressure", minBar: 0, maxBar: 207 }
```

**Option B** — keep both unit-system pairs:

```ts
{ trace: "spp", name: "SPP", min: { metric: 0, imperial: 0 }, max: { metric: 207, imperial: 3000 }, unitMetric: "bar", unitImperial: "psi" }
```

**Pick Option A** — single source of truth, derived display. Less
drift, smaller schema.

`LogTrack`, `FloatingGaugeSidebar`, `GaugeCollapsedStrip` must read
`kind` + canonical bounds and call `formatQuantity` for axis labels +
ticks.

### 5b.4 Refactor consumers

- `src/components/dashboard/sidebars/FloatingGaugeSidebar.tsx`
  - `GAUGE_RANGES` (line ~25): convert `min`/`max` to canonical
    metric. `kind` from `GAUGES`.
  - Header value/unit: render via `formatQuantity`.
  - Status thresholds: keep canonical metric; threshold check happens
    pre-format.
- `src/components/dashboard/sidebars/GaugeCollapsedStrip.tsx` — same
  pattern, reduced UI.
- `src/components/dashboard/chart/LogTrack.tsx`
  - Trace axis `min`/`max`: read canonical from `TRACK_TRACES`, apply
    `formatQuantity` per-axis to derive label + display range.
  - `TrackHeader` rendering of `t.min`, `t.max`, `t.unit`: route
    through `formatQuantity({ kind, value: t.minCanonical }, system)`.
- `src/data/dashboard-static.ts` `generateSession()` — values stay
  canonical metric. Only consumer-side conversion changes.

### 5b.5 Convert generator output to canonical metric

Currently the generator emits HKLD in `klbs`, SPP in `psi`, ROP in
`ft/hr`, WOB in `klbs`. After 5b they must emit canonical metric.
Either:

- (a) Rebalance the synthetic baselines in-place (multiply HKLD by
  4.448 to get kN, etc.), keeping shape but flipping units; or
- (b) Convert at the boundary where `WELL_SESSION.traces.*` are
  populated.

Option (a) is cleaner — the data layer becomes truthful canonical.
Numbers: `hkldDrillBase 185 klbs` → `~823 kN`; `sppDrillBase 2497 psi`
→ `~172 bar`; `rop 24 ft/hr` → `~7.3 m/hr`; `wob 20.5 klbs` → `~91 kN`.

### 5b.6 Wire format note

`StreamDef.DRILL` byte layout still encodes whatever the WS server
emits. Until protocol changes, the parser may need to convert wire
units → canonical metric immediately after `getFloat32`. Document the
contract: wire payload units are server-defined; client converts to
canonical at parse boundary in `binary-parser.ts`.

### Acceptance criteria

- `tsc -b` clean.
- Toggle Metric ↔ Imperial flips every gauge value + unit + axis
  label without page reload.
- Imperial display matches pre-Phase-5b values within ±0.5 (rounding).
- `grep "klbs\|psi\|ft/hr"` in `src/` returns only Phase 5b helper
  literals (`"klbs"` returned from `formatLoad` imperial path) and
  doc comments — no hardcoded UI strings.
- Status thresholds still trigger correctly (canonical, pre-format).

### Risks

| Risk | Mitigation |
|---|---|
| Visual regression on tick density | Re-tune adaptive thresholds per kind in metric; mirror DepthRuler pattern |
| Generator value drift if (a) | Snapshot one canonical sample per phase; assert post-refactor matches in unit tests if added |
| Torque unit deferred → mixed gauges | Mark explicitly `scalar` w/ literal unit; revisit when WS emits torque |
| Wire→canonical at parser changes timing of validation | Validate raw payload first, then convert; do not validate post-conversion |

---

## Phase 7 — Domain Hardening

**Risk: L-M** · **Touch: variable** · **Ship: incremental subtasks**

Post-MVP cleanup. Each subtask shippable independently.

### 7.1 Discriminated `Well` by `phase`

Drilling-phase fields are currently optional on every record. After
Phase 2 they are populated only when `phase === "drilling"`. Lift this
invariant into the type system:

```ts
interface WellBase {
  id: string;
  name: string;
  padId: string;
  wellType: WellType;
  status: WellStatus;
  lat: number;
  lon: number;
  operator: string;
  spud: string;
  targetDepth: string;
  field: string;
  region: string;
}

interface ProductionFlowFields {
  temperature: string;
  flowRate: string;
  pressure: string;
}

type Well =
  | (WellBase & ProductionFlowFields & { phase: "producing" | "injecting" })
  | (WellBase & {
      phase: "drilling";
      currentDepth: string;
      rop: string;
      daysOnWell: number;
      // production fields absent on drilling wells (was: "—" sentinel)
    })
  | (WellBase & {
      phase: "completion" | "shut-in";
      // neither drilling metrics nor production output yet
    });
```

Consumers (`ExplorerSidebar`, `getWellName`, etc.) gain exhaustive
`switch`/`if` narrowing — TS enforces handling each case.

**Migration**: rewrite `WELLS` literal so producing/injecting wells
drop `currentDepth/rop/daysOnWell`, drilling wells drop
`temperature/flowRate/pressure`. Sentinel `"—"` strings disappear from
`WELLS`. Display layer fills the visual gap with `"—"` only when
intentionally rendering a missing field.

**Acceptance**:
- `tsc -b` clean.
- `WELLS` literal has zero `"—"` placeholders.
- `ExplorerSidebar` metric branches type-narrow without runtime
  optional chains.

### 7.2 `MetricValue<T>` typed placeholder

Replace ad-hoc `string | "—"` with discriminated union:

```ts
type MetricValue<T> =
  | { ok: true;  value: T }
  | { ok: false; reason: "unmeasured" | "unavailable" | "out-of-phase" };

function fmtMetric<T>(
  m: MetricValue<T>,
  fmt: (v: T) => string,
): string {
  return m.ok ? fmt(m.value) : "—";
}
```

Apply to fields like `currentDepth`, `rop`, `daysOnWell`,
`temperature`, `flowRate`, `pressure` once 7.1 lands. Rendering goes
through `fmtMetric` so the display string is uniform but the type
preserves the reason for absence.

**Scope**: only fields shown in WellListItem / DetailPanel sidebars.
Generator session traces stay raw numbers — they always exist.

**Acceptance**: zero literal `"—"` strings in component code (except
inside `fmtMetric`).

### 7.3 Co-locate `PAD_NAMES`

Currently `PAD_NAMES` lives in
`src/components/well-explorer/sidebar/PadMap.ts`. Cross-feature
consumers (`DashboardSubheader`) import from a sibling feature's
internals.

**Move** `PAD_NAMES` (and any related pad metadata) to
`src/data/pads.ts`. Re-export from old location for one revision if
external imports exist; else hard-move.

Possible pad shape:

```ts
export interface Pad {
  id: string;            // "pad-a"
  name: string;          // "Guntur Wellpad"
  shortName: string;     // "Guntur"
  field: string;         // "Guntur Geothermal"
  centroid: { lat: number; lon: number };
}

export const PADS: Record<string, Pad> = { ... };
export const PAD_NAMES: Record<string, string> =
  Object.fromEntries(Object.entries(PADS).map(([k, v]) => [k, v.shortName]));
```

`PAD_BOUNDARIES` in
`src/components/well-explorer/lib/constants.ts` may move alongside
or stay as map-only data — judgment call. Default: keep map data with
map code, keep label data with central data layer.

**Acceptance**:
- `grep "PAD_NAMES" src/components/well-explorer/sidebar/PadMap` →
  only re-export (or empty).
- All `PAD_NAMES` consumers import from `@/data/pads`.

### 7.4 Audit `getWellName` callers

Post-context migration `getWellName(activeWellId)` is called with
`activeWellId: string | undefined`. Phase 0 patched the topbar w/
`activeWellId ? getWellName(activeWellId) : ""`. Other callers may
still pass `undefined` and silently return `"Unknown Well"`.

**Tasks**:
- `grep -rn "getWellName(" src/` — list all call sites.
- For each, prove input is `string` at call time, or explicitly handle
  the missing case (empty string / placeholder UI).
- Strengthen `getWellName(id: string)` to throw on `undefined` — TS
  forces callers to handle null. Or return
  `{ ok: false, reason: "unknown" }` à la `MetricValue`.

**Acceptance**:
- `getWellName` never silently returns `"Unknown Well"` from runtime
  paths the user can hit.
- Topbar/Footer fallback strings centralised, not per-call.

### 7.5 (Bonus) Remove `WellStatus` overlap with `WellPhase`

`status` (`drilling/standby/offline`) and `phase`
(`drilling/completion/producing/...`) overlap on `"drilling"`. Decide:

- **Option A**: keep both; document `status` = realtime ops signal,
  `phase` = lifecycle. Current Phase 2 stance.
- **Option B**: collapse `status` into `phase` + a separate
  `online: boolean` (or `connectivity: "online"|"offline"`). Cleaner
  but breaks `STATUS_DOT`, `STATUS_LABEL`, sidebar dot rendering.

Default: defer to Phase 7.5 unless the duplication actively confuses.

### 7.6 Tracking

Subtask commits:

- `refactor(types): phase 7.1 discriminated well union`
- `refactor(types): phase 7.2 metric-value placeholder`
- `refactor(data): phase 7.3 co-locate pad metadata`
- `refactor(types): phase 7.4 getWellName null safety`
- `refactor(types): phase 7.5 status vs phase reconcile (optional)`

### Risks

| Risk | Mitigation |
|---|---|
| 7.1 union breaks every consumer reading `well.temperature` etc. | Land 7.1 + consumer fixes in one commit; rely on tsc to enumerate sites |
| 7.2 rendering churn for placeholder strings | Apply only to sidebar/detail UI; defer ticker/footer if low-value |
| 7.3 import cycle if `pads.ts` references `wells.ts` | Keep `pads.ts` standalone (no Well imports); wells reference pads by id only |
| 7.4 throwing `getWellName` regresses runtime if a call site is missed | Land throwing version w/ TS strict mode in same commit; rely on type errors to find all sites |

---

## Risk Register

| Risk | Phase | Mitigation |
|---|---|---|
| Binary parser drift on field rename | 4 | Keep wire format; rename JS-side only |
| Unit toggle double-converts | 5 | Hard rule: canonical=metric, convert at render boundary |
| Phase enum mismatch with existing `status` | 2 | Both fields coexist; document distinction in CLAUDE.md |
| Trace color collision (H2S vs existing) | 4 | Pick distinct token; visual review |
| Settings localStorage migration | 5 | New key; default if absent |

---

## Tracking

Each phase = one commit (or PR if scope > one session). Commit prefix:

- `feat(domain): phase 1 verify domain cleanup`
- `feat(model): phase 2 well type extension`
- `feat(ui): phase 3 status-aware sidebar`
- `feat(domain): phase 4 h2s trace`
- `feat(settings): phase 5 unit system`
- `refactor(data): phase 6 metric depth canonical`

Update this section with `(DONE YYYY-MM-DD)` markers as phases land.
