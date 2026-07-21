---
name: debug-graph
description: Use when a LangGraph agent run in this repo misbehaves — a tool never gets called, a tool call hangs/errors, a human-in-the-loop gate never fires, graph state seems lost, or thread history/state doesn't persist across restarts.
---

# Debug Graph

## Overview

`apps/agent/src/langgraph` is a two-node `StateGraph` (`agent` ⇄ `toolExecutor`) with no LangGraph-native checkpointer and no LangGraph-native `interrupt()` — this repo's HITL and persistence both work differently than textbook LangGraph, which is the source of most confusing bugs here. Check the actual mechanism below before assuming standard LangGraph semantics.

## Persistence: no checkpointer in code

`grep -rn "checkpointer\|MemorySaver\|PostgresSaver" apps/agent/src/langgraph` returns nothing — `agent.ts` compiles with `.compile()` and no checkpointer option. Persistence is entirely external: `pnpm dev` runs `langgraphjs up --postgres-uri "$POSTGRES_URL" --port 8123`, so threads/state persist because the CLI attaches Postgres, not because the graph asked for it.

**Implication:** `pnpm dev:studio` (`langgraphjs dev --port 8124`) does **not** pass `--postgres-uri` — it's a separate, unpersisted instance on a different port. If a thread's state "disappears" while debugging, check which of the two dev servers (:8123 vs :8124) you're actually pointed at before suspecting a code bug.

## Tool calls: the only routing decision is in `route-after-agent.ts`

`routeAfterAgent` (`nodes/route-after-agent.ts`) checks whether every `tool_call` in the last AI message's name is in `LOCAL_TOOL_NAMES` (built from the `tools` array exported by `tools/index.ts`):

- All local → routes to `toolExecutor` (`ToolNode`), which looks the tool up **by name** in that same array
- Any non-local → routes to `END` (treated as a frontend-only/CopilotKit action, not an error)

If a tool "does nothing" when called, check in this order:

1. Is it actually exported and pushed into the `tools` array in `tools/index.ts`? A tool defined but not registered there fails silently — no error anywhere, the LLM just never has it available.
2. Does `constants/prompts.ts`'s `SYSTEM_PROMPT` mention it? The LLM won't reliably pick a tool it wasn't told exists.
3. Did the tool's `execute` actually run — check the `[copilotkit] -> / <- / x` request logs from `api/hooks.ts` for the request's duration and status; `x` lines log the caught error with full context.
4. Does the tool return `JSON.stringify(result)`? See the `create-tool` skill — a raw-object return doesn't error here, but breaks the CopilotKit action's parse of `result`.

## Human-in-the-loop: no LangGraph `interrupt()` — this is a CopilotKit-only mechanism

There is no `interrupt()`/`NodeInterrupt`/`Command` anywhere in `apps/agent/src/langgraph`. What looks like an interrupt is actually: a frontend hook (`useFlightSelectionGate.tsx`, `useHotelBookingGate.tsx`) registers a CopilotKit `useHumanInTheLoop` action (e.g. `waitForFlightSelection`), which — while the hook is mounted — gets synced into the graph's `state.tools` and bound alongside backend tools in `nodes/call-model.ts`. When the LLM calls that action, `routeAfterAgent` sees a non-local tool name and routes to `END`, and CopilotKit's AG-UI bridge surfaces it to the frontend as a pending action — no graph-side pause/resume involved at all.

**If a HITL gate never fires, check in this order** (this exact chain is broken today for both existing gates):

1. Is the hook actually called in `apps/web/src/components/chat/TravelChat.tsx`? `useFlightSelectionGate`/`useHotelBookingGate` are exported from `hooks/index.ts` but **not called** there as of this writing — an unmounted hook never registers its action, so it never reaches `state.tools`, and the LLM can never call it.
2. If mounted: is the action name present in `constants/tools.ts`'s `ACTIONS` and does the graph's `SYSTEM_PROMPT` reference it?
3. If the LLM calls it: confirm in the request logs that `routeAfterAgent` routed to `END` (not `toolExecutor` — it shouldn't be in `LOCAL_TOOL_NAMES`).

## State sync: graph nodes never write `GraphState`'s booking fields

`flights`, `hotel`, `destination`, `startDate`, `endDate`, `travelers`, `tools` in `state.ts` all use a `lastValue` reducer — frontend-owned, last-write-wins. If a node "loses" a value that was set earlier, the fix is never in the graph: check the frontend's `useCoAgent<TripState>` `setState` calls in `useTripState.tsx` instead.

## Observability

- **Per-request HTTP logging**: `api/hooks.ts` logs every CopilotKit request/response/error with duration (`[copilotkit] -> METHOD path`, `<- ... status Nms`, `x ... failed after Nms`) — first place to check for a slow or failing request.
- **Step-by-step graph execution**: there's no custom event emission or `streamMode` config in this repo — for node-by-node tracing, use LangSmith (`LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` env vars from `apps/agent/.env.example`), not console logging.
- **Visual graph inspection**: `pnpm dev:studio` (port 8124) is a real, working LangGraph Studio-style dev server — it's just undocumented in `apps/agent/README.md` (which still describes the old Mastra setup) and the root README.
- `nodes/call-model.ts` has no try/catch around `model.invoke()` — an LLM call failure there is not caught locally; it propagates up through the graph run rather than being wrapped into a tool-style error message.
