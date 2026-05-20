# realtime-monitoring

RTDC — Real-Time Drilling Control Room dashboard for the **Guntur Geothermal
Field**. Web-based control-room UI with live WITSML telemetry, multi-track log
charts, interactive well map, alarm management, and three industrial display
themes.

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in VITE_WS_URL + VITE_WS_TOKEN
pnpm dev               # opens http://localhost:5173
```

The dashboard expects a WebSocket backend on `ws://localhost:8080`. Use
**[witsml-socket-cs](https://github.com/raisal21/witsml-socket-cs)** (C# /
.NET 9 + QuestDB — the canonical server). The legacy Node.js stub at
`stubs/witsml-socket.ts` is no longer maintained.

## Environment

| Variable | Description | Default | Required |
|---|---|---|---|
| `VITE_WS_URL` | WebSocket backend URL | `ws://localhost:8080` | Yes |
| `VITE_WS_TOKEN` | HANDSHAKE auth token — must match backend `Auth:HandshakeToken` | — | Yes |
| `VITE_LOG_LEVEL` | `debug` &#124; `info` &#124; `warn` &#124; `error` | `debug` | No |

## Features

- **Real-time log charts** — multi-track ECharts (Drill, Hydraulics, Geo,
  Directional). Time and depth modes, live scroll, preset ranges (1h–7d).
- **Well explorer** — MapLibre GL map; 12 wells across 3 pads (Guntur,
  Talpad, North Ridge). Search, filter by type, detail panel.
- **Alarm management** — severity levels (critical/warning/info), ACK with
  operator identity, scrolling ticker, auto-open sidebar on critical.
- **Gauge sidebar** — instantaneous dials: RPM, WOB, Torque, SPP, HKLD,
  Gamma, ROP, H2S, Inc, Azi.
- **Configurable tracks** — drag-and-drop reorder, resize, visibility toggle
  per track.
- **Role-based UI** — driller (full), geologist (geo-only), data-scientist
  (no alarms).
- **Three themes** — Gruvbox, Tomorrow Eighties, Solarized Dark.
- **Metric / imperial** unit toggle, font size, density.
- **Auto-reconnect** — exponential backoff, status indicator in topbar.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Vite dev server (port 5173) |
| `pnpm build` | Type-check then production build |
| `pnpm lint` | ESLint |
| `pnpm preview` | Preview production build locally |

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, React 19, React Router v7 |
| Build | Vite 7 + `@vitejs/plugin-react-swc` |
| Styling | Tailwind CSS v4, CSS-variable theming |
| State | Zustand v5 (single store, 7 slices) |
| Data | TanStack Query v5 + Zod v4 |
| Charts | ECharts (tree-shaken) |
| Map | MapLibre GL JS |
| Drag-drop | `@dnd-kit` |
| UI primitives | `@base-ui/react`, `cva`, `lucide-react` |

## Project structure

```
src/
├── components/
│   ├── app-shell/        # Topbar, breadcrumbs, error banner
│   ├── auth/             # Login form, role selector
│   ├── dashboard/        # Charts, alarms, gauges, modals, popovers, sidebars
│   ├── ui/               # Reusable primitives (Button, Popover, etc.)
│   └── well-explorer/    # MapLibre GL well map + sidebar
├── store/
│   ├── index-store.ts    # Global Zustand store (connection, telemetry,
│   │                     #   alarm, subscription, UI, chart, settings, toast)
│   └── slices/           # chart-slice, settings-slice, ui-slice, toast-slice
├── services/
│   ├── rig-client.ts     # Low-level WebSocketStream client
│   ├── connection-manager.ts  # Retry loop, message dispatch → store
│   ├── binary-parser.ts  # ArrayBuffer → typed telemetry (DataView + Zod)
│   └── protocol.ts       # Server message handlers
├── data/                 # Static well/session data
├── domain/               # Domain types, constants
├── lib/                  # Utilities, unit conversion
├── hooks/                # Custom React hooks
├── routes.tsx            # Route definitions (lazy-loaded, auth guards)
├── App.tsx
└── main.tsx
```

## Architecture

```
Browser (React 19 SPA)
  └─ Zustand Store (7 slices)
       └─ Services
            ├─ rig-client.ts      → WebSocketStream + state machine
            ├─ connection-manager → retry loop, message dispatch
            ├─ binary-parser.ts   → DataView + Zod validation
            └─ protocol.ts        → typed message handlers
                 ↕ WebSocket (JSON + binary frames)
witsml-socket-cs (C# / .NET 9, port 8080)
  └─ QuestDB (time-series persistence)
```

**WebSocket protocol:** HANDSHAKE → WELCOME → SUBSCRIBE → binary telemetry
(DRILL 101 @ 10 Hz / GEO 102 @ 1 Hz) + JSON control (ALARM_RAISED,
ALARM_ACKED, HEARTBEAT). Full spec in [witsml-socket-cs
README](https://github.com/raisal21/witsml-socket-cs).

## Key conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no non-erasable TypeScript syntax
- Use `pnpm` (not npm/yarn)
- Env vars must be prefixed `VITE_` to be exposed to client
- Desktop-only (minimum 1024×768 viewport)

## Related

- [witsml-socket-cs](https://github.com/raisal21/witsml-socket-cs) — C# / .NET 9 backend (the canonical WebSocket server)
