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

pnpm storybook                    # turbo: run Storybook
```

Single test file / single test, agent (`apps/agent`, Vitest):

```bash
cd apps/agent
pnpm vitest run src/nodes/__tests__/classify.test.ts
pnpm vitest run -t "returns the classified intent"
pnpm test:watch                   # watch mode
```

Single test, web (`apps/web`, Jest):

```bash
cd apps/web
pnpm test -- src/hooks/__tests__/useFlightAction.test.tsx
pnpm test:watch
```

### Environment setup

```bash
cp apps/agent/.env.example apps/agent/.env
cp apps/web/.env.local.example apps/web/.env.local
```

`apps/agent/.env` needs `OPENAI_API_KEY`, `POSTGRES_URL` (Postgres — LangGraph checkpointing), and `LANGSMITH_API_KEY` (required for `pnpm dev`, since `langgraph up` needs a LangSmith deployment to run the local Postgres-backed server). `apps/web/.env.local` needs `VITE_RUNTIME_URL` (LangGraph server `/chat`, default `:8123`) and `VITE_COPILOTKIT_PUBLIC_LICENSE_KEY`.

Git hooks: Husky runs `lint-staged` on commit (eslint --fix + prettier) and CommitLint on commit-msg (Conventional Commits, types: feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert, header ≤100 chars, no start/pascal/upper case subjects).

## Architecture

### Monorepo layout

- `apps/web` — React 19 + Vite frontend, CopilotKit chat UI, generative UI cards
- `apps/agent` — the LangGraph agent backend (see below)
- `apps/storybook` — Storybook for `apps/web` components
- `packages/types`, `packages/schemas`, `packages/constants` — shared TS types, Zod schemas, and constants consumed by both `web` and `agent` as `@repo/*` workspace packages
- `packages/eslint-config`, `packages/typescript-config` — shared lint/tsconfig bases

### Agent backend: LangGraph

`apps/agent/src/` is the conversational agent: a `StateGraph` (`agent.ts`) that classifies the user's intent (`nodes/classify.ts`, via `Command.goto`) and routes to one of six specialized agents in `agents/` — `explore`, `plan` (`planningAgent`), `bookFlight`, `bookHotel`, `cancelBooking`, `general` — each built by the shared `createSpecializedAgent` factory (`agents/shared/create-agent.ts`) with its own tool set and system-prompt sections, then a final `saveMemory` node (`nodes/memory.ts`). The `plan` agent hands off to `bookFlight`/`bookHotel` via dedicated handoff tools (`tools/handoffs.ts`, `Command.PARENT`) rather than a conditional edge; booking tools request human approval mid-tool-call via LangGraph's `interrupt()` (`tools/booking/shared.ts`'s `requestBookingApproval`), which is what CopilotKit's AG-UI bridge surfaces to the frontend. Served via `langgraphjs up` on `:8123`; `src/api/app.ts` mounts a Hono app exposing `/chat` through `@copilotkit/runtime/v2` (`registerCopilotKit` in `api/copilotkit.ts`), wrapping the graph in a `BridgedLangGraphAgent`. `api/hooks.ts` adds request/response logging and rejects CopilotKit requests for unregistered agent IDs.

Its own `tools/`, `services/`, `schemas/` are organized per domain (flights, hotel, weather, route, places, tips, destination-explorer, trip-summary, booking, knowledge) directly under `apps/agent/src/` — no path alias needed, it's the only tree. `infrastructure/` holds the OpenAI/chat-model client and the Postgres-backed memory + knowledge (`pgvector`) stores; `knowledge/` holds source loading/chunking for the RAG knowledge base; `evals/` holds model-backed agent behavior evaluations (`pnpm test:evals`, excluded from the normal unit-test run).

### Frontend: CopilotKit-driven state and generative UI

- `apps/web/src/app/providers.tsx` wraps the app in `<CopilotKit>`, pointed at the LangGraph runtime (`VITE_RUNTIME_URL`), keyed by the active thread ID, with the user's OpenAI key and client date/timezone sent as headers on every request.
- **Trip state sync**: `hooks/useTripState.tsx` uses `useCoAgent<TripState>` to two-way-sync booking state (`flights`, `hotel`, etc.) between the graph's `GraphState` (`apps/agent/src/state.ts`) and a Zustand store (`stores/tripStateStore.ts`, persisted to localStorage per thread). The graph treats these fields as **frontend-owned, last-write-wins** (see the `lastValue` reducer in `state.ts`) — graph nodes read them, never write them.
- **Tool → UI pattern**: each domain has a `use<Domain>Action` hook (e.g. `useFlightAction`) that calls `useRenderToolCall` to register a CopilotKit-renderable action mirroring a backend tool, switches on `status` (`inProgress`/`complete`/etc.), and renders the matching card component (`components/FlightCard`, `HotelCard`, `WeatherCard`, `RouteCard`, `PlacesCard`, `LocalTipsCard`, `TripSummaryCard`, `DestinationExplorerCard`). See `.claude/docs/FLIGHT_FLOW.md` for the full request/response trace through the layers, and `.claude/docs/IMPLEMENT.md` for the mandated 4-layer separation (LangGraph tool → CopilotKit action → generative UI component → chat UI) that new tool integrations must follow.
- Some flows gate on human confirmation before proceeding — `hooks/useBookingAction.tsx`'s `useLangGraphInterrupt` renders a `BookingApprovalCard` for the `interrupt()` call the matching booking tool makes mid-execution (see `tools/booking/shared.ts`'s `requestBookingApproval`), rather than a separate backend routing step.

### Shared packages

`@repo/types`, `@repo/schemas`, `@repo/constants` are the cross-cutting contract between `web` and `agent` — flight/hotel/route/weather/place shapes and their Zod schemas live here so both apps validate against the same definitions. Check here before defining a type or schema that looks like it should be shared.
