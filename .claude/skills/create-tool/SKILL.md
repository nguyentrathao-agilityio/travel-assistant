---
name: create-tool
description: Use when writing or reviewing a single LangChain tool in this repo — a new tool() wrapper under src/tools/ plus its schema and service — for a backend-only tool or an additional tool on an existing domain, not a full new domain with frontend UI.
---

# Create Tool

## Overview

A LangChain tool in this repo is always 3 files: schema, service, tool wrapper — same shape every time. The LangChain-specific contract (string return) breaks silently if skipped, and TypeScript won't catch it.

## When to use vs `add-agent-tool`

- Adding a brand-new domain with its own frontend card (`FlightCard`-style), end to end → use `add-agent-tool` instead (its steps 1-4 are this skill's checklist, plus the frontend/shared-types wiring on top).
- Adding a backend-only tool, a tool with no dedicated UI card, an additional tool on an existing domain, or you just need the correct authoring pattern → use this skill.

## The 3 files

1. **Schema** (`src/schemas/<name>.ts`) — 3 schemas per tool: input schema (what the LLM must provide), API response schema (snake_case, matches the raw external API), tool-output schema (camelCase, what the service returns after mapping).

2. **Service** (`src/services/<name>.ts`) — real pattern, from `services/weather.ts`:

```typescript
export const searchX = async (input: { /* ... */ }): Promise<XToolOutput> => {
  const endpoint = `${API_URL}${ENDPOINTS.X}`;
  const params = new URLSearchParams({
    /* ... */
  });

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`);
    if (!res.ok) throw new Error(`X API failed: ${res.status} ${res.statusText}`);

    const raw = await res.json();
    const parsed = XResponseSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`Invalid X response shape: ${parsed.error.message}`);

    return {
      /* map parsed.data snake_case -> camelCase */
    };
  } catch (error) {
    if (error instanceof Error) throw new Error(`Failed to fetch X: ${error.message}`);
    throw new Error('Failed to fetch X: Unknown error');
  }
};
```

3. **Tool** (`src/tools/<name>.ts`) — the LangChain wrapper, from `tools/weather.ts`:

```typescript
export const xTool = tool(
  async (input) => {
    try {
      const result = await searchX(input);
      return JSON.stringify(result); // MUST be a string
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.X,
      });
    }
  },
  { name: 'xTool', description: '...', schema: XInputSchema }
);
```

## The one rule that silently breaks things

`tool()`'s execute function **must return a string** — `JSON.stringify(result)`, always, including the error path. A plain-object return compiles fine and only fails downstream when the CopilotKit action tries to parse `result` at runtime. This is the single most common mistake with this pattern; see the `review-copilotkit-layers` skill for how it surfaces at the CopilotKit-action layer.

## After writing the tool

1. **Register it in `tools/index.ts`** — export and add to the `tools` array. A tool not in this array is never bound to the model: no error anywhere, it's just silently unavailable to the LLM.
2. Add the `constants/endpoints.ts` entry and a `constants/messages.ts` error message.
3. Document it in `constants/prompts.ts`'s `SYSTEM_PROMPT` — the LLM won't reliably pick a tool it was never told exists.
4. If a frontend CopilotKit action/card also touches this tool, run the `review-copilotkit-layers` skill before calling it done.
