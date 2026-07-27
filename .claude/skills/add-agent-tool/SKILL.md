---
name: add-agent-tool
description: Use when adding a new travel-domain agent capability (search/book something new — car rentals, insurance, transfers) to this repo, or wiring a new LangGraph tool through to a frontend CopilotKit action and generative UI card.
---

# Add Agent Tool

## Overview

A new domain capability touches ~15-19 files across the agent backend, shared packages, and frontend. Missing one doesn't fail the build — the tool silently never reaches the LLM, or reaches it but its UI never renders. This is the checklist, built from tracing how `hotel` is actually wired end to end.

## Where to build

`apps/agent/src/langgraph/` is the only agent tree (wired into `langgraph.json`, `pnpm dev`). Build new tools here.

`src/langgraph/schemas/*` inlines its own schemas rather than importing `@repo/schemas` (see the "now inlined for full independence" comment in `schemas/hotel.ts`) — follow that: define the new domain's schemas directly under `src/langgraph/schemas/`. `packages/types` (`@repo/types`) is still the real shared contract for frontend-facing shapes (`TripState`, `HotelAvailability`, etc.) — add new shared types there.

## File checklist

Pick the closest existing domain and mirror it file-for-file (`hotel` = date range + single pick, richest example; `flights` = departure/return pair; `weather`/`tips` = single lookup, no selection state).

**Backend — `apps/agent/src/langgraph/`**

1. `schemas/<domain>.ts` — input schema, API response schema (snake_case), tool-output schema (camelCase)
2. `services/<domain>.ts` — fetch + `res.ok` check + Zod `safeParse` + snake_case→camelCase mapping (see `services/weather.ts`)
3. `tools/<domain>.ts` — `tool()` wrapper. **Must `return JSON.stringify(result)`** — a string, not the raw object (LangChain's contract; TypeScript won't catch a plain-object return here). Wrap the body in try/catch, mirroring `tools/weather.ts`. Steps 1-3 are exactly the `create-tool` skill's checklist — use it for the full authoring reference.
4. `tools/index.ts` — export and add to the `tools` array
5. `constants/endpoints.ts` — add the `ENDPOINTS` entry
6. `constants/messages.ts` — add a `TOOL_ERROR_MESSAGES` entry
7. `constants/prompts.ts` — document the new tool in `SYSTEM_PROMPT`

**Shared — `packages/types/src/`**

8. `<domain>.ts` (new) + `index.ts` (export)
9. `agent.ts` — add the field to `TripState` if the frontend needs to persist a user selection

**Frontend — `apps/web/src/`**

10. `constants/tools.ts` — add to `TOOL_NAMES` (and suggestion list if applicable)
11. `constants/<domain>.ts`, `utils/<domain>.ts` — display constants + badge/derived-value helpers
12. `components/<Domain>Card/index.tsx` (+ sub-components) — generative UI card. Check current convention before placing it: `.claude/docs/shared.md` says these belong in `components/generative/`, but every existing card (`FlightCard`, `HotelCard`, `WeatherCard`, ...) actually lives flat at `components/<Name>Card/`. Follow what's actually there and flag the doc/reality mismatch to the user rather than silently picking one.
13. `components/index.ts` — export
14. `hooks/use<Domain>Action.tsx` — use `useRenderToolCall` (the project's actual convention — see `useFlightAction.tsx`/`useWeatherAction.tsx`), not raw `useCopilotAction`. Handle every `status` value, not just `inProgress`.
15. `hooks/index.ts` — export
16. `hooks/useTripState.tsx` — add a `select<Domain>` setter if there's a bookable selection
17. **Wire the new hook into `apps/web/src/components/chat/TravelChat.tsx`** by calling `use<Domain>Action()` alongside the other `use*Action()` calls there. This step is easy to skip silently: `useHotelBookingGate` and `useFlightSelectionGate` are already exported from `hooks/index.ts` and referenced in the system prompt, but neither is actually called in `TravelChat.tsx` today — their HITL gates are dead. Verify the new hook call is actually present in that file, not just exported from the barrel.

## Before writing code

State the plan (which files, mirroring which existing domain) and get it confirmed — this is a 15+ file change, and `.claude/docs/implement.md` already requires a confirmed plan before touching existing files. Call out anything you're inferring rather than confirming as open questions: the shape of the external API endpoint (lives outside this repo), whether `packages/schemas` (`@repo/schemas`, still used by some frontend code) also needs an entry, whether tests are expected (see existing `**/__tests__/` folders under `src/langgraph/` for the current pattern — Vitest, `vi.mock`/`vi.hoisted` for mocking).

## After writing code

Run the `review-copilotkit-layers` skill against the new tool/action/component trio before treating the feature as done.
