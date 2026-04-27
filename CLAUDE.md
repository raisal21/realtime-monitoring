# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check (tsc -b) + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
```

No test runner is configured.

## Path Aliases

`@/*` maps to `./src/*` — use this throughout instead of relative paths.

## Architecture Overview

Real-time drilling/well monitoring dashboard. Data flows from a WebSocket server → service layer → Zustand store → React components.

### Routing (`src/App.tsx`)

```
/ → redirect to /wells
/auth → Auth page
/dashboard → Dashboard (wrapped in Context Providers)
/wells → WellExplorer (MapLibre GL map view)
```

### State Management (two layers)

**Zustand** (`src/store/index-store.ts`) — global async state:
- `ConnectionSlice`: status (OFFLINE | CONNECTING | ONLINE | RECONNECTING | ERROR), clientId, sendMsg, retry logic
- `TelemetrySlice`: `drillStream[]` and `geoStream[]` circular buffers (200-point capacity each)
- `AlarmSlice`: `alarmRegistry` (Map), register/ack/resolve/clearAll
- `SubscriptionSlice`: `activeTopics` (Set), subscribe/unsubscribe, reconcileTopics, restoreSubscriptions

**React Context + useReducer** (`src/stores/dashboard-store.tsx`) — dashboard UI state:
- `UiState`: sidebar open/closed, popover visibility, alarm filters, ack modal
- `ChartState`: mode (time/depth), liveMode, rangePreset, trace/track visibility/order/widths
- `SettingsState`: theme, density, fontSize, sampleRate, smoothing, sound/notifications

### Service Layer (`src/services/`)

Three-layer separation:
- **`rig-client.ts`** — low-level WebSocket state machine (CLOSED → CONNECTING → HANDSHAKING → ACTIVE → CLOSING); hardcoded to `ws://localhost:8080`; 3s handshake timeout
- **`connection-manager.ts`** — orchestrates lifecycle: exponential backoff (10 retries, 30s cap, 5min max elapsed), subscription restoration on reconnect, routes parsed messages to store
- **`protocol.ts`** — handles discriminated-union text messages (WELCOME, SUBSCRIBE_ACK, UNSUBSCRIBE_ACK, ALARM_*, CLOSING)
- **`binary-parser.ts`** — decodes ArrayBuffer frames via DataView; first byte = stream ID (101=DRILL, 102=GEO)

### Message Protocol (`src/domain/`)

All messages are Zod-validated (`message.schema.ts`, `message.types.ts`). Binary streams:
- **StreamDef.DRILL (101)**: timestamp, depth, sequence, rpm, wob, torque, hkld, spp
- **StreamDef.GEO (102)**: timestamp, latitude, longitude + geospatial data

Constants (stream IDs, backoff params) live in `src/domain/constants.ts`.

### Component Structure

```
Dashboard.tsx
└── UiProvider → ChartProvider → SettingsProvider
    └── DashboardLayout
        ├── UniversalTopbar / DashboardSubheader / AlarmTicker / Footer
        ├── LeftToolRail (collapsible, auto-collapses < 1366px)
        ├── Chart renderers: TimeRuler, DepthRuler, LogTrack, WellProfileTrack, FlowRuler
        ├── FloatingGaugeSidebar / FloatingAlarmSidebar (or collapsed strip variants)
        └── Popovers: SettingsPopover, ZoomPopover, DisplayLayoutPopover
```

Shared components (alarm, telemetry, well, core, form, select, popover, navigation, footer, display) live in `src/components/`. Dashboard-specific components are under `src/components/dashboard/`.

### Keyboard Shortcuts (`src/hooks/dashboard-hooks.ts`)

`[` / `]` zoom, `Cmd+K` settings, `Cmd+L` live mode, `Cmd+B` left rail, `Cmd+.` gauge sidebar, `Cmd+/` alarm sidebar, `Escape` close all.

### Static Data

Track metadata and range presets are in `src/data/dashboard-static.ts`.

## Key Dependencies

- **React 19 + react-router-dom 7** — UI and routing
- **Zustand 5** — global state
- **TailwindCSS 4** (via `@tailwindcss/vite`) — styling; no PostCSS config needed
- **Zod 4** — runtime message validation
- **MapLibre GL 5** — well map in WellExplorer
- **@base-ui/react** — headless primitives (popovers, modals, triggers)
- **aedes + ws** — MQTT/WebSocket broker for local dev/testing
