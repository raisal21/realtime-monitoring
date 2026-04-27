# AGENTS.md

## Commands

```bash
pnpm dev      # Start Vite dev server
pnpm build    # typecheck then build (tsc -b && vite build)
pnpm lint     # ESLint
```

No test runner configured. Add tests before submitting changes that affect logic.

## Stack

- **Runtime**: Node.js, React 19, React Router v7
- **Build**: Vite 7 + `@vitejs/plugin-react-swc`
- **Styling**: Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- **State**: Zustand v5
- **Data**: TanStack Query v5 + Zod v4
- **Map**: MapLibre GL
- **WebSocket server**: Node.js + `ws` (runs separately, port 8080)

## Project structure

- `src/` — frontend (Vite app)
- `stubs/witsml-socket.ts` — Node.js WebSocket server stub (runs standalone, not bundled with Vite)
- `tsconfig.app.json` — TypeScript config for frontend
- `tsconfig.node.json` — TypeScript config for Vite config
- `tsconfig.server.json` — TypeScript config for stubs (separate output dir: `dist-server`)

## Key conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no non-erasable TypeScript syntax
- Use `pnpm` (not npm/yarn) — `pnpm-lock.yaml` is the lockfile
- `.env` with `VITE_LOG_LEVEL=debug` exists — env vars must be prefixed `VITE_` to be exposed to client

## Backend protocol (stubs/witsml-socket.ts)

- WebSocket server on `ws://0.0.0.0:8080`
- Binary frames (40 bytes): DRILL (101) every 100ms, GEO (102) every 1s
- JSON protocol for control messages: HANDSHAKE → SUBSCRIBE/UNSUBSCRIBE/ALARM_ACK
- Client must send HANDSHAKE first after connecting
- Run independently: `tsx stubs/witsml-socket.ts`