---
name: review-copilotkit-layers
description: Use when reviewing, or having just written or modified, a LangGraph tool + CopilotKit action hook + generative UI card trio in this repo — before treating that tool integration as finished.
---

# Review CopilotKit Tool Layers

## Overview

A tool integration here spans three files across two frameworks' contracts: a LangChain tool, a CopilotKit action hook, and a React component. Violations don't fail typecheck or lint — they fail silently at runtime, only when the LLM calls the tool with edge-case input or the upstream API errors. Check the specific files touched against this list; general "does it look right" review misses the framework-specific ones below.

## Checklist

**LangChain tool — `src/langgraph/tools/*.ts`**

- [ ] Returns `JSON.stringify(result)` — a **string** — not a raw object. LangChain's `tool()` contract requires a string return. Returning an object breaks the CopilotKit action's ability to parse `result`, and TypeScript does not catch this — `tool()`'s inferred return type doesn't enforce it.
- [ ] Body wrapped in try/catch; errors returned as `JSON.stringify({ error: ... })` rather than thrown raw (see `tools/weather.ts`).

**Service — `src/langgraph/services/*.ts`**

- [ ] Checks `res.ok` before parsing — a non-2xx response must throw a clear error, not get parsed as JSON (which throws an opaque `SyntaxError` on an HTML error page).
- [ ] Validates the parsed response with Zod `safeParse`, throws on failure — don't let an unvalidated shape reach the UI.
- [ ] Query params go through `URLSearchParams`/`encodeURIComponent`, and the base URL comes from `constants/endpoints.ts` (`ENDPOINTS`/`API_URL`), not an inline `process.env.API_URL`.

**CopilotKit action hook — `apps/web/src/hooks/use*Action.tsx`**

- [ ] Uses `useRenderToolCall` (this project's convention — see `useFlightAction.tsx`, `useWeatherAction.tsx`), not raw `useCopilotAction`.
- [ ] Handles every `status` the render function can receive — not just `status === 'inProgress'`. A hook that only special-cases the loading state passes an undefined/error `result` straight into the generative component on failure.
- [ ] Imports the rendered component from the barrel (`@/components`), not a deep path.

**Generative UI component — `apps/web/src/components/*Card/index.tsx`**

- [ ] `if (!data) return null` (or equivalent) as the first line — it _will_ render with `data` undefined while streaming or on failure; this isn't hypothetical.
- [ ] Empty-results case handled (`data.results?.length` guard), not just the undefined case.
- [ ] No property access that assumes every field is always present in the API response.

## Why these specifically

These are this stack's actual silent-failure modes, not generic React mistakes: LangChain's string-return tool contract and CopilotKit's status-driven rendering both fail without a type error. Under time pressure, the two most stack-specific items — the `JSON.stringify` return and full status-branch coverage — are the ones most likely to get skipped, because a plain object return and an `inProgress`-only branch both look correct at a glance and compile cleanly.

## Related

Use the `add-agent-tool` skill for the full file checklist when the tool doesn't exist yet.
