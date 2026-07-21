# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For frontend/agent implementation work, `.claude/CLAUDE.md` routes you to detailed guides in `.claude/docs/` (`SHARED.md`, `IMPLEMENT.md`, `FIX_BUGS.md`, `REVIEW.md`). Read those before writing code in `apps/web` or `apps/agent` — this file covers commands and architecture only.

## What this is

Travel Planner Assistant — a conversational AI travel planning app (flights, hotels, routes, weather, local tips, full itinerary generation) built as a pnpm/Turborepo monorepo. It exists to practice agentic architecture: LangChainJS/LangGraph for orchestration, CopilotKit + AG-UI for the streaming chat frontend.

## Commands

Run from repo root unless noted. Package manager is **pnpm** (`packageManager: pnpm@10.33.4`), Node >= 24.

```bash
pnpm install                      # install all workspace deps

pnpm dev                          # turbo: run all apps in dev mode
pnpm --filter web dev             # frontend only (vite, :3000)
pnpm --filter agent dev           # agent only (langgraphjs up, :8123)

pnpm build                        # turbo: build all apps
pnpm typecheck                    # turbo: tsc --noEmit across workspace
pnpm lint                         # turbo: eslint across workspace
pnpm lint:fix                     # turbo: eslint --fix across workspace

pnpm test                         # turbo: run tests in all apps (Vitest)
pnpm test:agent                   # agent tests only — pnpm --filter agent test
pnpm test:coverage                # turbo: tests with coverage

pnpm eval:agent                   # evalite run (agent LLM-quality evals, needs OPENAI_API_KEY)
pnpm eval:agent:serve             # interactive evalite results UI
pnpm eval:agent:ci                # evals against a real LLM, CI mode
pnpm eval:agent:export            # export last eval run to eval-report/

pnpm storybook                    # turbo: run Storybook
```

Single test file / single test, agent (`apps/agent`, Vitest):

```bash
cd apps/agent
pnpm vitest run src/mastra/services/__tests__/weatherService.test.ts
pnpm vitest run -t "returns fallback tip when AI tip generation fails"
pnpm test:watch                   # watch mode
RECORD=1 pnpm vitest run <file>   # re-record MSW/AIMock fixtures
```

Single test, web (`apps/web`, Jest):

```bash
cd apps/web
pnpm test -- src/hooks/__tests__/useFlightAction.test.tsx
pnpm test:watch
```

Agent-specific extras (run inside `apps/agent`):

```bash
pnpm dev:studio                   # langgraphjs dev server on :8124 (LangGraph Studio, no browser)
pnpm aimock                       # replay recorded LLM responses for deterministic runs
pnpm aimock:record                # record new LLM fixtures
```

### Environment setup

```bash
cp apps/agent/.env.example apps/agent/.env
cp apps/web/.env.local.example apps/web/.env.local
```

`apps/agent/.env` needs `OPENAI_API_KEY`, `POSTGRES_URL` (Postgres — LangGraph checkpointing + Mastra memory/RAG), and `LANGSMITH_API_KEY` (required for `pnpm dev`, since `langgraph up` needs a LangSmith deployment to run the local Postgres-backed server). `apps/web/.env.local` needs `VITE_RUNTIME_URL` (LangGraph server `/chat`, default `:8123`), `VITE_MASTRA_URL` (Mastra REST base, default `:4111`), and `VITE_COPILOTKIT_PUBLIC_LICENSE_KEY`.

Git hooks: Husky runs `lint-staged` on commit (eslint --fix + prettier) and CommitLint on commit-msg (Conventional Commits, types: feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert, header ≤100 chars, no start/pascal/upper case subjects).

## Architecture

### Monorepo layout

- `apps/web` — React 19 + Vite frontend, CopilotKit chat UI, generative UI cards
- `apps/agent` — the agent backend; **contains two parallel implementations** (see below)
- `apps/storybook` — Storybook for `apps/web` components
- `packages/types`, `packages/schemas`, `packages/constants` — shared TS types, Zod schemas, and constants consumed by both `web` and `agent` as `@repo/*` workspace packages
- `packages/eslint-config`, `packages/typescript-config` — shared lint/tsconfig bases

### Agent backend: LangGraph (active) + Mastra (RAG/evals/legacy) side by side

`apps/agent/src/` has two independent trees that **both run simultaneously** in dev — don't assume one is dead code:

- **`src/langgraph/`** — the live conversational agent. A `StateGraph` (`agent.ts`) with an `agent` node (`nodes/call-model.ts`, binds backend + frontend/CopilotKit tools) and a `toolExecutor` node (`ToolNode`), routed by `nodes/route-after-agent.ts` (backend tool calls → `toolExecutor`; frontend-only/HITL tool calls → `END` so CopilotKit's AG-UI bridge can surface them as interrupts). Served via `langgraphjs up` on `:8123`; `src/langgraph/api/app.ts` mounts a Hono app exposing `/chat` through `@copilotkit/runtime/v2` (`registerCopilotKit` in `api/copilotkit.ts`), wrapping the graph in a `BridgedLangGraphAgent`. `api/hooks.ts` adds request/response logging and rejects CopilotKit requests for unregistered agent IDs.
- **`src/mastra/`** — a Mastra `Mastra` instance (`index.ts`) that serves REST endpoints on `:4111`: RAG ingestion/query (`routes/seed-rag.ts`, pgvector-backed via `@mastra/rag`), thread/message history the frontend reads via `mastraClient`, and its own (older) CopilotKit `/chat` route via `@ag-ui/mastra`. It also owns the **eval suite** (`src/mastra/evals/*.eval.ts`, run with `evalite`) and the **test suite** (`src/mastra/services/__tests__/*.test.ts` — MSW mocks HTTP, AIMock mocks the LLM; `*.chaos.test.ts` files test 500s/timeouts/malformed responses).
- Both trees have their own `tools/`, `services/`, `schemas/` per domain (flights, hotel, weather, route, places, tips, destination-explorer, trip-summary) — largely mirrored, not shared. When adding a domain feature, check whether it belongs in one tree, the other, or both.
- Path aliases differ per tree: `@/*` → `src/mastra/*`, `@langgraph/*` → `src/langgraph/*` (see `apps/agent/tsconfig.json` and `vitest.config.ts`). Don't cross-import between the two without the alias.

### Frontend: CopilotKit-driven state and generative UI

- `apps/web/src/app/providers.tsx` wraps the app in `<CopilotKit>`, pointed at the LangGraph runtime (`VITE_RUNTIME_URL`), keyed by the active thread ID, with the user's OpenAI key and client date/timezone sent as headers on every request.
- **Trip state sync**: `hooks/useTripState.tsx` uses `useCoAgent<TripState>` to two-way-sync booking state (`flights`, `hotel`, etc.) between the graph's `GraphState` (`apps/agent/src/langgraph/state.ts`) and a Zustand store (`stores/tripStateStore.ts`, persisted to localStorage per thread). The graph treats these fields as **frontend-owned, last-write-wins** (see the `lastValue` reducer in `state.ts`) — graph nodes read them, never write them.
- **Tool → UI pattern**: each domain has a `use<Domain>Action` hook (e.g. `useFlightAction`) that calls `useRenderToolCall` to register a CopilotKit-renderable action mirroring a backend tool, switches on `status` (`inProgress`/`complete`/etc.), and renders the matching card component (`components/FlightCard`, `HotelCard`, `WeatherCard`, `RouteCard`, `PlacesCard`, `LocalTipsCard`, `TripSummaryCard`, `DestinationExplorerCard`). See `.claude/docs/FLIGHT_FLOW.md` for the full request/response trace through the layers, and `.claude/docs/IMPLEMENT.md` for the mandated 4-layer separation (Mastra/LangGraph tool → CopilotKit action → generative UI component → chat UI) that new tool integrations must follow.
- Some flows gate on human confirmation before proceeding (`useFlightSelectionGate`, `useHotelBookingGate`, `useBookedActions`) — these are the frontend-only actions that `route-after-agent.ts` routes to `END` as interrupts rather than executing as backend tools.

### Shared packages

`@repo/types`, `@repo/schemas`, `@repo/constants` are the cross-cutting contract between `web` and `agent` — flight/hotel/route/weather/place shapes and their Zod schemas live here so both apps validate against the same definitions. Check here before defining a type or schema that looks like it should be shared.
