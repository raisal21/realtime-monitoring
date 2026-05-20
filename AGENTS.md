# AGENTS.md

## Commands

```bash
pnpm dev      # Start Vite dev server (port 5173)
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

## Search

When searching the codebase, always use `bm25_search` (BM25-ranked search) alongside `grep` for better relevance. `bm25_search` uses ripgrep for candidate matching then ranks results with the Okapi BM25 algorithm.

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

## Comments

- **Language**: English only — comments *and* identifiers. Domain terms are
  exempt (Guntur, rig, wellbore, WITSML, ROP, WOB, gamma, etc.).
- **Why, not what**: a comment explains intent, an invariant, a trade-off, or
  a gotcha. It never paraphrases the line below it. If the code already says
  it, delete the comment.
- **No changelog comments**: no `Phase N.x` markers, no "removed in …", no
  dated history. That belongs in git and `NAPKIN.md`.
- **Banner dividers**: a section banner is `//` followed by a 77-char `=`
  run. One format — no `─` or `-` variants.
- **Doc comments** (TSDoc `/** */`): optional. Add one only for a non-obvious
  invariant or gotcha on a public function. No blanket doc-comment rule — do
  not restate type-safe signatures the types already describe.
- **Security comments**: may point at a recorded decision (`see NAPKIN
  2026-05-21`), never describe an exploit path. Never commit a secret in a
  comment — if you find one, flag it for rotation.
- Enforced by code review. There is no CI gate for comments.