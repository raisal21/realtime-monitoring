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

---

## Phase 8 — Brand Identity: Favicon + Document Title

**Risk: L** · **Touch: 3 files** · **Ship: solo**

Replace generic Vite favicon (`/public/vite.svg`) and title `"Realtime Monitoring"` with the in-house `PulseR` brand mark and a domain-accurate title. Cheap visible win — every browser tab + bookmark currently shows Vite default.

### 8.1 Goal

- Favicon = static SVG export of `PulseR` (gruvbox theme tokens hardcoded since favicon renders before any CSS theme loads).
- Title = `"RTDC · Guntur Geothermal"` (or `"Realtime Drilling Control · Guntur"` — pick one and keep it in sync with `Footer` footer-string `RTDC v0.2.0-alpha`).

### 8.2 Steps

**Step 1 — Generate static SVG.**
`PulseR` is a React component, not a static SVG file. Browsers fetch the favicon over HTTP before any JS runs, so the React tree never renders. Two options:

- **Option A (recommended)** — hand-port the JSX from `src/components/brand/PulseR.tsx` lines 38-63 into a plain `.svg` file at `public/pulse-r.svg`. Inline the gruvbox values directly:
  - `fgColor` = `#ebdbb2`
  - `accentColor` = `#83a598` (info — neutral default for favicon)
  - `scanOpacity = 0.85`, `dimOpacity1 = 0.5`, `dimOpacity2 = 0.25`
  - Keep `viewBox="0 0 64 64"` and `shape-rendering="crispEdges"` so it stays sharp at 16/32 px.
- **Option B** — write a tiny Node script (`scripts/build-favicon.mjs`) that imports `react-dom/server`, calls `renderToStaticMarkup(<PulseR tone="default" status="info" />)`, writes to `public/pulse-r.svg`. Run as a `prebuild` npm script so favicon stays in sync with the React component automatically. Heavier, but no drift.

Default: **Option A**. Favicon rarely changes. One-time port + comment on top of the SVG referencing the source component is enough.

**Step 2 — Add SVG file at `public/pulse-r.svg`.**
Strip React-isms: `xmlns` stays, drop `className`, drop the `<g>` wrapper if not needed (kept for clarity is fine), convert any camelCase attrs that don't apply to raw SVG. Source attrs already use kebab-case (`shape-rendering`, `stroke-width`) so port is near-verbatim.

**Step 3 — Wire `index.html`.**
Replace lines 5 and 8:

```diff
-    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
+    <link rel="icon" type="image/svg+xml" href="/pulse-r.svg" />
-    <title>Realtime Monitoring</title>
+    <title>RTDC · Guntur Geothermal</title>
```

Optional polish: add a `<link rel="mask-icon">` + `<meta name="theme-color" content="#1d2021">` (gruvbox base) so Safari pinned tabs and mobile chrome bars match.

**Step 4 — Delete `public/vite.svg`.**
Dead asset once the link is rewired. `grep -r "vite.svg" .` first to confirm no other references.

### 8.3 What to watch for

- **Theme drift**: favicon is frozen gruvbox. If the user switches to `tomorrow` or `solarized`, the tab icon will not follow — accepted. SVG-with-CSS-vars does not work because the favicon SVG is loaded outside the document and has no access to `:root` vars.
- **Dynamic favicon (status-aware)** is possible later: a `useFavicon()` hook can swap `link[rel=icon].href` at runtime when alarm severity escalates. Out of scope for Phase 8 — open Phase 8b if/when wanted.
- **Build hashing**: Vite copies `public/*` verbatim with no fingerprint. Browsers may cache. Bump filename to `pulse-r-v1.svg` if cache-busting needed.
- **Title sync**: keep tab title aligned with `Footer` brand string. If brand becomes "RTDC v0.3.x" later, update both at once.

### 8.4 Acceptance criteria

- New tab shows the `PulseR` mark, not the Vite logo.
- Tab title reads `RTDC · Guntur Geothermal` (or chosen variant).
- `public/vite.svg` deleted.
- `grep -rn "vite.svg\|Realtime Monitoring" .` returns zero matches outside `node_modules` and historical NOTES.

---

## Phase 9 — Performance & Code Quality Pass

**Risk: L-M** · **Touch: ~8 files** · **Ship: incremental subtasks**

Findings from a full audit of `src/pages/`, `src/components/`, `src/index.css`, `src/routes.tsx`, `src/guards/`. Each subtask is independently shippable. Ordered by impact.

### 9.1 Route-level code splitting (biggest win)

**Problem.** `src/routes.tsx` imports `Dashboard`, `WellExplorer`, `Auth`, `404` synchronously at the top. Result: the very first paint of `/auth` ships the entire chart engine, every dashboard panel, MapLibre GL (heavy), and AckModal in one bundle. Most users hit `/auth` first and never see those bytes during sign-in.

**Fix.** Convert each page to `React.lazy` + `<Suspense>` so the chunk only downloads when its route activates.

**Steps.**

1. Replace direct imports in `src/routes.tsx`:
   ```tsx
   import { lazy, Suspense } from "react";
   const Dashboard    = lazy(() => import("@/pages/Dashboard"));
   const WellExplorer = lazy(() => import("@/pages/WellExplorer"));
   const Auth         = lazy(() => import("@/pages/Auth"));
   const NotFoundPage = lazy(() => import("@/pages/404"));
   ```
2. Wrap `<Routes>` (or each lazy element) in `<Suspense fallback={<RouteFallback />}>`. Build a minimal `RouteFallback` that uses existing tokens — solid `bg-base` + a centered status dot or skeleton — so the fallback flash matches the active theme and never flashes white.
3. Force MapLibre into its own chunk via dynamic import inside `useMaplibre.ts` if it is not already isolated. Vite's default chunking should already split it once the page is lazy, but verify with `vite build --mode production` and inspect `dist/assets/`.
4. Pre-warm critical chunks on idle: in `Auth.tsx`, after first paint, fire `import("@/pages/WellExplorer")` inside `requestIdleCallback` so the navigation post-login feels instant. Optional but cheap.

**What to watch for.**

- Suspense fallback must not unmount providers above it — keep `<Suspense>` *inside* `AuthenticatedLayout`'s `<Outlet />` boundary so context (auth, current well) does not reset on every navigation.
- `StrictMode` double-mounts in dev only; do not chase the doubled lazy fetch.
- Dynamic imports break if the path is computed. Keep paths static literals.
- Watch initial bundle size before/after with `vite build` output. Expect `40-60%` initial JS reduction. Record numbers in commit body.

**Acceptance.**
- `dist/assets/index-*.js` initial chunk size strictly smaller than baseline.
- Network tab shows separate chunks fetched only on first visit to `/wells` and `/dashboard`.
- No flicker of providers across navigations.

### 9.2 `Dashboard.tsx` stale-closure + missing resize listener

**Problem.** `src/pages/Dashboard.tsx:30-37`:

```tsx
useEffect(() => {
  const checkWidth = () => {
    if (window.innerWidth < 1366 && ui.leftRail === "expanded") {
      uiDispatch({ type: "SET_LEFT_RAIL", value: "collapsed" });
    }
  };
  checkWidth();
}, []);
```

Two bugs in five lines:
1. Empty dep array + reads `ui.leftRail` from closure → stale on every re-render after mount. The check uses the value of `ui.leftRail` as it was at first render, not the current one.
2. No `resize` listener attached. The auto-collapse only fires on mount, not when the user actually drags the window across the 1366 px threshold.

**Fix.**

```tsx
useEffect(() => {
  const onResize = () => {
    if (window.innerWidth < 1366) {
      uiDispatch({ type: "SET_LEFT_RAIL", value: "collapsed" });
    }
  };
  onResize();
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, [uiDispatch]);
```

**What to watch for.**

- Drop the `ui.leftRail === "expanded"` guard — dispatching the same value on a reducer should be a no-op (or you can early-return inside the reducer). Reading `ui.leftRail` here re-introduces the stale-closure trap.
- If the user *intentionally* re-expands the rail below 1366 px after auto-collapse, the listener will fight them on the next resize event. Add a one-shot flag (`useRef(false)`) so auto-collapse only happens once per breakpoint crossing.
- Consider extracting to a `useViewportBreakpoint(1366)` hook for reuse — `LeftToolRail` likely has the same logic duplicated somewhere.
- Throttle with `requestAnimationFrame` or a 100 ms debounce if the dispatch becomes hot. For a single boolean flip it is fine raw.

**Acceptance.**
- Resize from 1500 → 1200 px → rail auto-collapses without page reload.
- Resize back to 1500 px does not auto-expand (one-way collapse, by design).
- React DevTools shows no "stale state" warnings.

### 9.3 Provider tree split in `routes.tsx`

**Problem.** `src/routes.tsx:23-32`. `/wells` has no `CurrentWellProvider`. `/wells/:wellId` does. Navigating from `/wells` → `/wells/:wellId` mounts a new provider subtree → all well-scoped state, refs, and any in-flight effects reset. `WellExplorer.tsx` already wraps an inner provider keyed on `selectedWell?.id` (per Phase 0 notes), so the outer route-level provider is partially redundant but inconsistent.

**Fix options.**

- **Option A** — hoist `CurrentWellProvider` to wrap *both* `/wells` and `/wells/:wellId` routes (single provider, fed by `useParams()` inside the provider). Simplest.
- **Option B** — put `CurrentWellProvider` inside `AuthenticatedLayout` so every authenticated route shares one provider. Cleanest if more routes will need it. Matches Phase 0 intent ("seeded from route param `:wellId`").

**Steps (Option B).**

1. Move provider into `src/layouts/AuthenticatedLayout.tsx`, wrapping the `<Outlet />`.
2. Remove the per-route wrappers in `routes.tsx` for `/wells/:wellId` and `/dashboard/:wellId?`.
3. Inside provider, read `useParams<{ wellId?: string }>()` and resolve to `WELLS.find(...)` or `WELLS[0]`.
4. Remove the inner keyed provider in `WellExplorer.tsx` if Phase 0 added one — single source of truth.

**What to watch for.**

- Every consumer of `useCurrentWell()` must tolerate the provider mounting once at layout level and surviving across route changes. Check `Footer`, `UniversalTopbar`, `DashboardSubheader`.
- `useParams()` returns `undefined` for `wellId` on `/wells` — handle the no-selection case explicitly. Do not silently fallback to `WELLS[0]` on the explorer landing page (breadcrumb should show "Wells" not "Wells > [PROD-GA-01]").
- React Router 7 re-renders all parent routes on param change — provider memo should compare resolved well by id, not by reference, to avoid unnecessary downstream re-renders.

**Acceptance.**
- Navigate `/wells` → `/wells/ga-01` → `/wells/ga-02`: provider does not unmount/remount (verify via React DevTools).
- Footer well name updates on each navigation.
- No double-render of dashboard panels.

### 9.4 Missing `AuthGuard` on authenticated routes

**Problem.** `src/guards/GuestGuard.tsx` exists for `/auth`. There is no `AuthGuard` for `/wells`, `/dashboard`. Direct URL hit (`https://app/dashboard`) renders the page without authentication. Likely a real bug, not a perf concern.

**Fix.**

1. Create `src/guards/AuthGuard.tsx`:
   ```tsx
   import { Navigate, useLocation } from "react-router-dom";
   import { useAuth } from "@/hooks/useAuth";
   import type { ReactNode } from "react";

   export function AuthGuard({ children }: { children: ReactNode }) {
     const { isAuthenticated } = useAuth();
     const location = useLocation();
     if (!isAuthenticated) {
       return <Navigate to="/auth" replace state={{ from: location }} />;
     }
     return <>{children}</>;
   }
   ```
2. Wrap `AuthenticatedLayout` element in `routes.tsx`:
   ```tsx
   <Route element={<AuthGuard><AuthenticatedLayout /></AuthGuard>}>
     ...
   </Route>
   ```
3. In `Auth.tsx` `handleSignIn`, read `location.state?.from?.pathname` and `navigate(from ?? "/wells", { replace: true })` so post-login lands on the originally requested URL.

**What to watch for.**

- `useAuth()` must return synchronously on first render. If auth check is async (token validation against server), add an "auth loading" state — guards rendering `<Navigate>` while auth is still loading would bounce the user to `/auth` mid-validation.
- `replace: true` on the redirect prevents back-button loops.
- Pair with `GuestGuard` semantics: authenticated user hitting `/auth` redirects to `/wells`. Already in place.

**Acceptance.**
- Direct hit on `/dashboard/ga-01` while logged out → redirected to `/auth`.
- After login → land on `/dashboard/ga-01`, not `/wells`.
- Logged-in user hitting `/auth` still redirects to `/wells` (existing GuestGuard).

### 9.5 `WellExplorer.tsx` search not debounced

**Problem.** `src/pages/WellExplorer.tsx:17-25`. `query` updates on every keystroke → `filteredWells` recomputes (cheap) → new array reference passes to `useMaplibre({ wells: filteredWells, ... })` → likely triggers map source/marker rebuild on each keystroke. For ~100 wells acceptable; at scale it stalls input.

**Fix.**

1. Add `useDebouncedValue` hook (or use existing if any in `src/hooks/`):
   ```ts
   export function useDebouncedValue<T>(value: T, delayMs: number): T {
     const [debounced, setDebounced] = useState(value);
     useEffect(() => {
       const id = setTimeout(() => setDebounced(value), delayMs);
       return () => clearTimeout(id);
     }, [value, delayMs]);
     return debounced;
   }
   ```
2. In `WellExplorer.tsx`:
   ```ts
   const debouncedQuery = useDebouncedValue(query, 150);
   const filteredWells = useMemo(() => { /* use debouncedQuery */ }, [debouncedQuery, activeType]);
   ```
3. Sidebar input continues to bind to immediate `query` (instant feedback in the textbox); only the *map* sees the debounced value. UX trick: input feels responsive, expensive work is throttled.

**What to watch for.**

- 150 ms is a sweet spot — long enough to skip per-keystroke work, short enough that users do not notice. Bump to 250 ms only if profiling shows MapLibre work is the bottleneck.
- Make sure `useMaplibre` *internally* memoizes marker creation by well `id`, not by array identity. Otherwise debounce only delays the same problem. Audit `useMaplibre.ts` source/marker effects: deps array should reference `wells.map(w => w.id).join(",")` or use a structural hash.
- Verify that activeType filter (button toggle, not text input) does not need debouncing — single click is one update, fine to be immediate.

**Acceptance.**
- Type "guntur" rapidly: textbox echoes instantly, map markers update once after typing stops.
- Profiling shows ≤1 MapLibre re-source per ~150 ms instead of per keystroke.

### 9.6 `Auth.tsx` imperative DOM scroll

**Problem.** `src/pages/Auth.tsx:33-37`:

```tsx
const handleLoginClick = () => {
  const form = document.getElementById("login-form");
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
  form?.querySelector("input")?.focus();
};
```

Imperative DOM access from a React component. Brittle (depends on a string id rendered far away in a child), bypasses React reconciliation, fragile under SSR/hydration if it ever ships.

**Fix.**

1. Lift refs into `Auth.tsx`:
   ```tsx
   const formRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   ```
2. Pass refs into `AuthCard` → `LoginForm`:
   ```tsx
   <AuthCard onSignIn={handleSignIn} formRef={formRef} firstInputRef={inputRef} />
   ```
3. `handleLoginClick` becomes:
   ```tsx
   const handleLoginClick = () => {
     formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
     inputRef.current?.focus();
   };
   ```
4. In `LoginForm`, attach `inputRef` to the email input. Remove the `id="login-form"` attribute if it was only there for `getElementById`.

**What to watch for.**

- `forwardRef` may be needed if `AuthCard`/`LoginForm` are component types that cannot accept a ref directly. React 19 allows passing `ref` as a regular prop on function components — confirm version.
- If `scrollIntoView` is the user's desired UX (scroll then focus), preserve order and timing. `behavior: "smooth"` runs async; calling `focus()` immediately after will jump scroll. If that becomes visible, wrap focus in `setTimeout(..., 300)` or use `scrollend` event.

**Acceptance.**
- Topbar "Login" button still scrolls and focuses input.
- No `getElementById`/`querySelector` calls in `src/pages/Auth.tsx`.

### 9.7 `404.tsx` inline font-family literals

**Problem.** `src/pages/404.tsx:20, 23, 26, 32` use Tailwind arbitrary-value font literals: `font-['Barlow_Condensed',sans-serif]`. The design system already exposes `--font-ui`, `--font-body`, `--font-mono` via `index.css` `@theme` block. Inline literals duplicate this and bypass the token system — if the brand font ever changes, this file is the one place it forks.

**Fix.**

1. Use Tailwind v4 utilities derived from `@theme`: `font-ui`, `font-body`, `font-mono`. Verify Tailwind generates them; they should because `@theme` registers `--font-*` tokens.
2. Replace each occurrence:
   - `font-['Barlow_Condensed',sans-serif] font-extrabold` → `font-ui font-extrabold`
   - `font-['Barlow_Condensed',sans-serif] font-bold` → `font-ui font-bold`
   - `font-['Barlow',sans-serif]` → `font-body`
3. Same audit pass on any other component — `grep -rn "font-\[" src/` to find stragglers.

**What to watch for.**

- Tailwind v4's font utility generation requires the `--font-*` token to be in the `@theme` layer (it is, in `index.css:60-62`).
- If `font-ui` is not generated, fall back to `style={{ fontFamily: "var(--font-ui)" }}` rather than re-introducing literals.
- 404 page is rarely seen — deprioritize until a broader typography sweep is planned.

**Acceptance.**
- `grep -n "font-\[" src/pages/404.tsx` → zero matches.
- Visual regression check: 404 page renders identically.

### 9.8 `index.css` blanket theme transition

**Problem.** `src/index.css:952-958`:

```css
[data-theme] {
  transition:
    background-color 280ms ease,
    color 280ms ease,
    border-color 280ms ease,
    box-shadow 280ms ease;
}
```

Applies a 4-property transition to `<html>`. Children inherit `transition` if explicitly set, but `transition` is non-inherited by default — so this is actually scoped to the root element. Cost is minimal. Flagged for awareness, not action.

**Where it might bite.**

- If, later, `transition` is added to a base-layer rule on `*` or to a wide selector, the cost compounds. Watch for that during future CSS additions.
- On theme switch, even with the transition only on `<html>`, the *visual* re-paint is full-screen. Fine on desktop, may be visible on low-end machines.

**Optional improvement.**

- Wrap the theme switch in `document.documentElement.classList.add("theme-transitioning")`, apply transition only when that class is present, then remove the class after 280 ms. Prevents transition on initial paint and other non-theme repaints.

**Acceptance.** None — informational only. Mark resolved when a future CSS audit either keeps or replaces it.

### 9.9 `index.css` per-theme block duplication

**Problem.** Three `[data-theme="*"]` blocks (`gruvbox`, `tomorrow`, `solarized`) at `index.css:164-285` repeat the exact same set of `--theme-*` and `--trace-*` keys with different values. ~120 lines of structural repetition. Adding a fourth theme means another full block. Easy to miss a key and ship a partial theme.

**Fix options.**

- **Option A** — keep raw blocks, add a CI lint script (`scripts/check-themes.mjs`) that parses the CSS and asserts every theme defines the same set of keys. Fast, no runtime change.
- **Option B** — move theme palettes into a single TypeScript object (`src/data/themes.ts`) and inject as inline `<style>` at the document root. Theme switcher reads from one source. More invasive — affects build pipeline and SSR if added later.

Default: **Option A**. Linter is ~30 lines of Node, no runtime cost, catches the bug class entirely.

**Steps (Option A).**

1. Add `scripts/check-themes.mjs`:
   - Read `src/index.css`.
   - Find every `[data-theme="..."] { ... }` block via regex.
   - Extract `--theme-*` + `--trace-*` keys per block.
   - Diff key sets; fail with a clear list if any diverge.
2. Wire into `package.json`: `"prebuild": "node scripts/check-themes.mjs"`.
3. Run once now; expect all three themes to match. Fix any drift discovered.

**What to watch for.**

- Trace tokens (`--trace-rpm`, etc.) are theme-scoped; lint must include them.
- Comments inside blocks must not break the regex — use a tolerant parser or exclude comments before regex.
- If a future theme intentionally drops a key (unlikely), allow override via `// theme-lint-ignore` comment or a config list.

**Acceptance.**
- Removing any `--theme-*` line from one theme block fails the prebuild.
- `npm run build` runs the check before Vite.

### 9.10 Tracking

Subtask commits:

- `perf(routes): phase 9.1 lazy load routes`
- `fix(dashboard): phase 9.2 dashboard resize listener`
- `refactor(routes): phase 9.3 hoist current-well provider to layout`
- `feat(guards): phase 9.4 add AuthGuard`
- `perf(explorer): phase 9.5 debounce well search query`
- `refactor(auth): phase 9.6 replace getElementById with refs`
- `style(404): phase 9.7 use font-ui token utility`
- `chore(css): phase 9.8 theme transition note (no-op)`
- `chore(build): phase 9.9 lint theme key parity`

### Risk Register (Phase 9)

| Risk | Subtask | Mitigation |
|---|---|---|
| Lazy chunks regress fallback flicker | 9.1 | Theme-aware Suspense fallback, prewarm on idle |
| Provider hoist breaks WellExplorer's keyed inner provider | 9.3 | Audit `useCurrentWell()` consumers, remove duplicate inner provider in same commit |
| AuthGuard bounces during async auth init | 9.4 | Add `isLoading` state to `useAuth`, render null while loading |
| Debounce hides bug if `useMaplibre` is doing too much per render | 9.5 | Audit `useMaplibre` deps before debouncing — fix root cause if found |
| Tailwind `font-ui` utility not generated | 9.7 | Verify `@theme` `--font-*` registration; fallback to inline `style` |
| Theme lint false positives on comments | 9.9 | Strip comments before regex parse |

---

## Phase 10 — Unify UI State on Zustand

**Risk: M** · **Touch: ~15 files** · **Ship: incremental subtasks**

Project currently runs two parallel state worlds:

- **Zustand** (`src/store/index-store.ts`, `globalRigStore`) — connection, telemetry streams, alarms, subscriptions. Owned by services (`connection-manager.ts`, `rig-client.ts`). Pages do not read it.
- **React Context + useReducer** (`src/stores/app-store.tsx`) — `UiState`, `ChartState`, `SettingsState`. Owned by pages. Services do not read it.

`CurrentWellContext` sits orthogonal — pure route-derived value, no shared mutation.

Goal: collapse the two worlds into one Zustand store (or one store w/ slices), keep `CurrentWellContext` as thin Context. Net: pages gain selector-based re-render, services gain access to UI flags (e.g. `liveMode`, `unitSystem`), provider tree shrinks.

### 10.1 Scope

**Migrate to Zustand:**

- `UiState` — sidebar open/closed, popover visibility, alarm filters, ack modal, leftRail breakpoint state.
- `ChartState` — mode (time/depth), liveMode, rangePreset, trace/track visibility/order/widths.
- `SettingsState` — theme, density, fontSize, sampleRate, smoothing, sound/notifications, unitSystem.

**Keep as React Context:**

- `CurrentWellContext` — route-derived (`useParams` → `WELLS.find`), one-way data flow, no cross-component mutation. Zustand-ifying it = sync `useParams` → store via `useEffect` in layout, which adds indirection without benefit.

### 10.2 Why migrate

| Gain | Mechanism |
|---|---|
| Selector-based re-render | `useStore(s => s.ui.leftRail)` re-renders only on that slice change. Context+useReducer fires every consumer on any slice change. |
| Persist for free | `zustand/middleware persist` + `partialize` replaces hand-rolled `useEffect(() => localStorage.setItem(...), [state.x])` per setting. |
| Cross-slice access | `ChartTrace` rendering can read `settings.unitSystem` without nested context. Currently requires `useSettings()` + `useChart()` co-call. |
| Service ↔ UI bridge | `connection-manager.ts` already dispatches into `globalRigStore`. Once UI is in same store, e.g. `AlarmTicker` can read `alarmRegistry` directly without bouncing through context. |
| DevTools | `zustand/middleware/devtools` gives time-travel debug across telemetry + UI + settings. |
| Shorter provider tree | `AuthenticatedLayout` drops `SettingsProvider` + `UiProvider` wrappers. `Dashboard` route drops `ChartProvider`. Net: 3 Provider components removed. |

### 10.3 Architecture Decision

**Option A — Single store, many slices (recommended).** Extend existing `globalRigStore` w/ `UiSlice`, `ChartSlice`, `SettingsSlice`. Mirrors current slice pattern (`ConnectionSlice`, `TelemetrySlice`, `AlarmSlice`, `SubscriptionSlice`). One store, one DevTools timeline, one persist scope.

**Option B — Two stores.** Keep `globalRigStore` for service-driven state. New `uiStore` for UI/Chart/Settings. Cleaner separation, but doubles store boilerplate and breaks cross-slice subscribe (alarm filter UI reading alarm registry).

**Pick Option A.** Slice pattern already established. Cross-slice reads (alarm filter ↔ alarm registry) are real usage.

### 10.4 Steps

**Step 1 — Add slice files under `src/store/slices/`.**

Mirror existing slice structure:

```ts
// src/store/slices/ui-slice.ts
export interface UiSlice {
  ui: {
    leftRail: "expanded" | "collapsed";
    gaugeSidebar: "open" | "closed";
    alarmSidebar: "open" | "closed";
    settingsPopover: boolean;
    zoomPopover: boolean;
    ackModal: { open: boolean; alarmId: string | null };
    alarmFilter: AlarmFilter;
  };
  setLeftRail: (v: "expanded" | "collapsed") => void;
  setGaugeSidebar: (v: "open" | "closed") => void;
  // ...
}

export const createUiSlice: StateCreator<RootStore, [], [], UiSlice> = (set) => ({
  ui: { leftRail: "expanded", /* ... */ },
  setLeftRail: (v) => set((s) => ({ ui: { ...s.ui, leftRail: v } })),
  // ...
});
```

Repeat for `ChartSlice` and `SettingsSlice`. Action shapes mirror current `useReducer` action types — easier to grep-replace consumers later.

**Step 2 — Compose root store.**

```ts
// src/store/index-store.ts
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export type RootStore = ConnectionSlice & TelemetrySlice & AlarmSlice
  & SubscriptionSlice & UiSlice & ChartSlice & SettingsSlice;

export const globalRigStore = create<RootStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createConnectionSlice(...a),
        ...createTelemetrySlice(...a),
        ...createAlarmSlice(...a),
        ...createSubscriptionSlice(...a),
        ...createUiSlice(...a),
        ...createChartSlice(...a),
        ...createSettingsSlice(...a),
      }),
      {
        name: "rtdc-store",
        version: 1,
        partialize: (s) => ({
          ui: s.ui,            // optional — persist sidebar state across reloads
          chart: s.chart,      // optional — persist chart layout
          settings: s.settings // mandatory — already persisted today
        }),
        migrate: (persisted, version) => {
          // version 0 → 1 migration: lift old localStorage keys
          //   `rtdc.unitSystem`, etc. into the consolidated `rtdc-store`
          //   payload. Read legacy keys, merge, then `localStorage.removeItem`.
          return persisted as RootStore;
        },
      },
    ),
    { name: "rtdc" },
  ),
);
```

**Step 3 — Replace `useUi`, `useChart`, `useSettings` hook bodies.**

Two flavors of API are possible. Pick one and apply consistently:

- **API-compatible (stage 1, low-touch):**
  ```ts
  export function useUi() {
    const ui = useStore((s) => s.ui);
    const dispatch = useStore((s) => s.uiDispatch); // synthesized from action setters
    return { state: ui, dispatch };
  }
  ```
  Drop-in. Existing call sites (`const { state, dispatch } = useUi()`) keep working. **Caveat:** `useStore((s) => s.ui)` returns a fresh ref on any UI mutation → still a re-render storm. Use only as temporary shim during migration.

- **Selector-based (stage 2, target form):**
  ```ts
  // call site
  const leftRail = useStore((s) => s.ui.leftRail);
  const setLeftRail = useStore((s) => s.setLeftRail);
  ```
  Per-component selector. True per-slice re-render. Requires touching every call site — but that is exactly the perf gain we want.

**Migrate per consumer**, not all at once. Stage 1 lets the codebase compile; stage 2 happens incrementally.

**Step 4 — Delete `src/stores/app-store.tsx` Provider exports.**

Remove `UiProvider`, `ChartProvider`, `SettingsProvider`. Update `AuthenticatedLayout.tsx` (drop `<SettingsProvider><UiProvider>` wrapping) and `routes.tsx` (drop `<ChartProvider>` from `/dashboard/:wellId?`). Auth.tsx similarly drops its `<SettingsProvider><UiProvider>` (it had its own copy for the auth-page theme context).

**Step 5 — Migrate localStorage persist.**

Today: `SettingsProvider` writes `rtdc.unitSystem` (and likely others) via `useEffect`. After migration: `persist` middleware handles it. Add a one-time `migrate` fn in the persist config that reads legacy keys (`rtdc.unitSystem`, `rtdc.theme` if any) and folds them into the new `rtdc-store` payload, then `localStorage.removeItem` the legacy keys. Bump `version: 1`.

**Step 6 — Apply chart-state lifecycle decision.**

Currently `ChartProvider` wraps only `/dashboard/:wellId?` → chart state resets when user leaves the route. After Zustand singleton, it survives.

Two paths:

- (a) **Survive across nav** — desired in most cases. User flips chart layout, opens settings, returns later → state intact. Default.
- (b) **Reset on dashboard mount** — call `resetChart()` action from `Dashboard.tsx` `useEffect(() => resetChart, [])`. Choose only if UX explicitly wants fresh chart per session.

Pick (a). If (b) needed later, a single `resetChart()` action handles it.

### 10.5 What to watch for

- **Re-render hygiene.** Stage 1 shim recreates the Context-equivalent re-render storm. Plan ahead to migrate hot paths (`LogTrack`, `FlowRuler`, `FloatingGaugeSidebar`) to selector form first — those re-render every telemetry tick. Cold paths (`SettingsPopover`) can stay shimmed.
- **`useShallow` for derived objects.** When a selector returns an object (`useStore(s => ({ a: s.ui.a, b: s.ui.b }))`), it returns a fresh ref every render. Wrap in `useShallow` from `zustand/react/shallow` to compare by structural equality.
- **Action naming collisions.** Existing `globalRigStore` has `registerAlarm`, `reconcileTopics`, etc. UiSlice will likely add `setAlarmFilter`, `openAckModal`. Keep names slice-prefixed if collision risk (e.g. `ui.openAckModal` vs `alarm.acknowledgeAlarm`).
- **Persist scope.** Do NOT persist Telemetry/Connection/Alarm slices — they are runtime/server-driven. `partialize` to `{ ui, chart, settings }` only. Persisting alarms across reloads would resurrect stale alarm rows.
- **DevTools in prod.** `devtools` middleware auto-disables outside dev, but verify build flags. Wrap `devtools(...)` in `import.meta.env.DEV ?` if Vite tree-shaking misses it.
- **Test surface.** No test runner today. Rely on tsc + manual smoke. After migration, every action setter is a pure fn on the store — easier to add Vitest later.
- **CurrentWellContext stays.** Do not migrate. Document in CLAUDE.md why: route-derived, no shared mutation, Context is the right tool.
- **SSR.** Project is SPA → Zustand singleton fine. If SSR ever added, Zustand needs per-request store factory + Context bridge. Out of scope.

### 10.6 Subtasks

Each subtask shippable independently. tsc must stay green between subtasks.

- **10.a** Scaffolding: add `UiSlice`/`ChartSlice`/`SettingsSlice` files. Compose into `globalRigStore`. Slices unused yet — store has dual ownership briefly.
- **10.b** Migrate `useSettings()` to Zustand-backed shim. Move `localStorage` persist to middleware. Migration fn folds legacy `rtdc.unitSystem` into new `rtdc-store`.
- **10.c** Delete `SettingsProvider` from `AuthenticatedLayout` + `Auth.tsx`.
- **10.d** Migrate `useUi()` to Zustand-backed shim. Touch hot consumers (`Dashboard.tsx` resize listener, `LeftToolRail`) to selector form.
- **10.e** Delete `UiProvider` from `AuthenticatedLayout` + `Auth.tsx`.
- **10.f** Migrate `useChart()` to Zustand-backed shim. Touch hot consumers (`LogTrack`, `FlowRuler`, `WellProfileTrack`, `DepthRuler`, `TimeRuler`) to selector form.
- **10.g** Delete `ChartProvider` from `routes.tsx`. Decide chart-lifecycle (survive vs reset) — default survive.
- **10.h** Strip `src/stores/app-store.tsx` reducer code. File becomes a thin re-export of hooks pointing at Zustand. Or delete entirely if all consumers updated.
- **10.i** (optional) Add `useShallow` import where call sites return derived objects. Audit re-render counts via React DevTools profiler.

### 10.7 Acceptance criteria

- `tsc -b` clean throughout migration. Each subtask compiles.
- `pnpm run build` succeeds. Theme check still passes.
- No `<UiProvider>`, `<ChartProvider>`, `<SettingsProvider>` references remain in `src/`.
- `grep -rn "useReducer" src/stores/` returns zero (or only test fixtures).
- Settings persist across reload via `rtdc-store` localStorage key. Legacy `rtdc.unitSystem` key removed by migration fn on first run.
- React DevTools profiler shows fewer renders on telemetry tick — `LogTrack` re-renders only when its trace data changes, not on unrelated UI mutations.
- `CurrentWellProvider` untouched.

### 10.8 Tracking

Subtask commits:

- `feat(store): phase 10.a slice scaffolding`
- `refactor(settings): phase 10.b migrate useSettings to zustand`
- `chore(layout): phase 10.c drop SettingsProvider`
- `refactor(ui): phase 10.d migrate useUi to zustand`
- `chore(layout): phase 10.e drop UiProvider`
- `refactor(chart): phase 10.f migrate useChart to zustand`
- `chore(routes): phase 10.g drop ChartProvider, finalise lifecycle`
- `chore(store): phase 10.h delete legacy reducer code`
- `perf(store): phase 10.i useShallow audit + selector tightening`

### 10.9 Risk Register (Phase 10)

| Risk | Subtask | Mitigation |
|---|---|---|
| Stage-1 shim hides re-render bug → looks migrated, perf identical | 10.d/10.f | Profile before stage-2 selector pass; require selector form on hot paths in same commit |
| Persist migration loses settings on first reload | 10.b | `migrate` fn reads legacy keys w/ fallback; ship behind a feature flag for one release if cautious |
| Chart state survives across nav, breaks UX assumption | 10.g | Default survive; expose `resetChart()` action; revisit per user feedback |
| Cross-slice action name collision | 10.a | Slice-prefix where ambiguous; document naming convention in CLAUDE.md |
| `globalRigStore` becomes 1000+ line god-store | all | Slice files separate; `RootStore` is type union, not implementation |
| DevTools middleware shipped to prod | 10.a | Guard with `import.meta.env.DEV`; verify build output |
| Telemetry slice accidentally persisted → resurrects stale stream data | 10.b | `partialize` allowlist UI/Chart/Settings only; never blanket-persist root |

---

## Phase 11 — Vendor Chunk Split (Bundle Polish)

**Risk: L-M** · **Touch: 2 files (`vite.config.ts`, `package.json`)** · **Depends: Phase 10**

Post-Phase-9.1 lazy routes captured ~82% gzip reduction at `/auth` first-paint. Two chunks still warn `> 500 kB` raw:

- `Dashboard-*.js` ≈ 1.34 MB raw / 434 kB gzip — ECharts heavy.
- `WellExplorer-*.js` ≈ 1.08 MB raw / 292 kB gzip — MapLibre GL heavy.

Phase 11 splits ECharts + MapLibre into vendor chunks via `build.rollupOptions.output.manualChunks`. Goal is **not** initial-paint reduction (already shipped) — goal is **cache stability across deploys** + **cross-route warm cache** when more chart-consuming routes appear.

### 11.1 Why deferred (not done with Phase 9)

- First visit to `/dashboard` downloads same total bytes either way — ECharts has to land somewhere.
- Real win is incremental: vendor hash unchanged when only Dashboard code changes → repeat visitors skip re-download after deploy. Compound benefit only on weekly+ deploy cadence.
- Phase 10 zustand migration reshuffles import graph. `manualChunks` written before Phase 10 may produce stale chunk boundaries afterward. Better to split *after* imports settle.
- `chunkSizeWarning` is cosmetic (does not block build, does not hurt runtime). No production pressure to act.

### 11.2 When to actually do it

Trigger on any of:

- Deploy cadence reaches multiple per week → vendor cache stability compounds.
- Second chart library lands (recharts, d3, plotly) → without vendor split, ECharts ends up bundled twice across chunks.
- Adding routes that consume MapLibre beyond `/wells` → vendor split warms cache cross-route.
- Web Vitals regression on repeat visits.

If none of those → leave it.

### 11.3 Steps

**Step 1 — Add bundle analyzer first.**

```bash
pnpm add -D rollup-plugin-visualizer
```

`vite.config.ts`:

```ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE && visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

Run `ANALYZE=1 pnpm run build`. Inspect `dist/stats.html`. Confirm assumed dep weights — ECharts often pulls `zrender` separately, MapLibre pulls `pmtiles`/`@mapbox/*` transitive deps. **Do not guess; measure.**

**Step 2 — Define `manualChunks`.**

After visualizer data is in hand:

```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        echarts: ["echarts", "echarts-for-react"],
        maplibre: ["maplibre-gl"],
        react: ["react", "react-dom", "react-router-dom"],
        // optional further splits — only if visualizer shows them >100 kB:
        // "vendor-utils": ["date-fns", "zod", "clsx", "tailwind-merge"],
      },
    },
  },
},
```

Strategy notes:

- **Function form vs object form.** Object form is declarative and safer. Function form (`manualChunks(id) { if (id.includes("node_modules/echarts")) return "echarts" }`) is more flexible but easy to misroute. Start with object form.
- **`react` chunk** is optional. If only one entry point ever loads React (which is true here), Vite already shares it — no gain. Skip unless visualizer shows duplication.
- **Do not chunk by ad-hoc string match on transitive deps.** ECharts → `zrender` will follow ECharts into the `echarts` chunk because of import graph; no need to name it explicitly.

**Step 3 — Verify lazy-route boundaries still hold.**

After splitting, run `pnpm run build` and inspect chunk sizes:

- `index-*.js` (initial paint at `/auth`) MUST stay ≤ current 459 kB raw / 150 kB gzip. If it grows, a `manualChunks` rule pulled a vendor lib into the entry chunk — fix by tightening the rule.
- `Dashboard-*.js` should shrink by roughly the ECharts size minus shared overhead.
- `WellExplorer-*.js` should shrink by MapLibre size.
- New `echarts-*.js` and `maplibre-*.js` chunks should appear, fetched only when their consumer route activates.

**Step 4 — Tune `chunkSizeWarningLimit`.**

```ts
build: {
  chunkSizeWarningLimit: 800, // raw kB, post-split target
},
```

Set to a value that's loud when something genuinely regresses, quiet when current state is fine. 800 kB raw is a reasonable mid-point post-split.

**Step 5 — Document trigger to revisit.**

Add a comment block to `vite.config.ts` `manualChunks` listing the assumptions: "split because echarts > 600 kB raw; revisit if bundle analyzer shows shift". Future maintainers see the *why*, not just the *what*.

### 11.4 Steps that need verification, not assumption

- **Tree-shaking interaction.** ECharts ships full + partial entry points (`echarts/core` + `echarts/charts/LineChart`). If the codebase imports `echarts` (not the partial form), tree-shaking is partial. Check `src/lib/echarts-theme.ts` and chart components for import shape. If full `echarts` is imported, splitting is fine but switching to partial imports first is a bigger win — measure both.
- **Worker bundles.** MapLibre uses Web Workers (`maplibre-gl/dist/maplibre-gl-csp-worker`). Vite chunks workers separately by default. Confirm worker chunk is not duplicated into `maplibre` vendor chunk.
- **CSS chunks.** MapLibre ships its own CSS. `dist/assets/WellExplorer-*.css` (69.92 kB) likely contains it. Splitting JS does not affect CSS chunks unless `cssCodeSplit` config changes — leave alone.

### 11.5 What to watch for

- **Vendor split that makes things worse.** If `react` is force-chunked but only loaded once, the extra HTTP request + gzip overhead beats inlining. HTTP/2 multiplexing reduces per-request cost but doesn't eliminate it. Verify with Lighthouse before/after.
- **Cache invalidation drift.** Vendor chunks have stable hashes only if their content is stable. Upgrading `echarts` from `6.0.0` to `6.1.0` invalidates the chunk for *all* users, regardless of whether app code touched it. That is the trade — fewer invalidations from app-side churn, occasional big invalidation on dep upgrade. Acceptable.
- **Build time.** `manualChunks` adds negligible build time. `visualizer` adds ~2-3 s. Gate behind `ANALYZE` env var so default builds stay fast.
- **CDN / preload hints.** If a CDN with HTTP/3 sits in front, vendor chunks benefit from `<link rel="modulepreload">` on critical chunks. Out of scope for Phase 11; revisit if/when CDN added.

### 11.6 Subtasks

- **11.a** Add `rollup-plugin-visualizer` (dev dep), gate behind `ANALYZE` env. Run, inspect, save baseline `stats.html` to `docs/` if wanted.
- **11.b** Add `manualChunks` config for ECharts + MapLibre. Verify entry chunk size unchanged.
- **11.c** Audit ECharts imports — switch to partial entry points (`echarts/core`, register only used charts/components) if currently importing full `echarts`. Optional but bigger win.
- **11.d** Tune `chunkSizeWarningLimit`.
- **11.e** Document `manualChunks` rationale inline.

### 11.7 Acceptance criteria

- `pnpm run build` succeeds. No new warnings.
- `dist/assets/index-*.js` raw size ≤ pre-Phase-11 size (no regression on initial paint).
- `dist/assets/echarts-*.js` and `dist/assets/maplibre-*.js` chunks present, loaded only on consumer routes (verify via Network tab on hard reload of `/auth`).
- Hash of `echarts-*.js` stable across consecutive builds when no ECharts source changes.
- `chunkSizeWarningLimit` does not flag any chunk on green build.

### 11.8 Tracking

Subtask commits:

- `chore(build): phase 11.a add rollup visualizer`
- `perf(build): phase 11.b vendor chunk split echarts + maplibre`
- `perf(echarts): phase 11.c switch to partial entry points` (optional)
- `chore(build): phase 11.d tune chunk size warning`
- `docs(build): phase 11.e document manualChunks rationale`

### 11.9 Risk Register (Phase 11)

| Risk | Subtask | Mitigation |
|---|---|---|
| `manualChunks` rule pulls vendor into entry chunk → undoes Phase 9.1 | 11.b | Verify `index-*.js` size after every config change; CI check optional |
| Worker bundle duplication | 11.b | Inspect `dist/assets/*worker*.js`; ensure single instance |
| Partial ECharts imports break existing chart components | 11.c | Land per-component; tsc + visual smoke before merge |
| Vendor cache benefit invisible on first deploy | n/a | Compound benefit; measure on second+ deploy |
| Visualizer plugin shipped to prod | 11.a | Gate behind `ANALYZE` env; never default-on |
