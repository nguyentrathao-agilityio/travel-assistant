# Agent

Mastra-powered travel agent. Handles flight search, hotel search, route planning, weather tips, local tips, destination exploration, trip summary, and RAG over uploaded travel documents.

## Stack

- **Mastra** — agent runtime, tools, and workflows
- **PostgreSQL** — agent memory and workflow storage (`POSTGRES_URL`)
- **pgvector** — vector store for RAG (`travel_docs` index, 1536-dim)
- **OpenAI** — `gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings
- **CopilotKit** — `/chat` route exposes the agent to the frontend via AG-UI

## Environment variables

| Variable         | Required | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `POSTGRES_URL`   | yes      | PostgreSQL connection string                       |
| `OPENAI_API_KEY` | yes      | Used for embeddings and ingest                     |
| `OPENAI_MODEL`   | no       | Override chat model (default `openai/gpt-4o-mini`) |

## Development

```sh
pnpm dev          # starts Mastra dev server (hot-reload)
pnpm build        # production build
pnpm start        # start the built server
```

The agent server listens on port `4111` by default.

## RAG setup

Run once before using document upload:

```sh
tsx src/mastra/scripts/create-index.ts
```

This creates the `travel_docs` pgvector index (1536 dimensions).

## Tests

```sh
pnpm test         # run all unit tests (AIMock + MSW)
pnpm test:watch   # watch mode
```

An HTML report is written to `test-report/index.html` after every run:

```sh
cd test-report
npx http-server .
# Opens http://localhost:8080
```

Test files live in `src/mastra/services/__tests__/`. Each service has:

- `*.test.ts` — unit tests (MSW mocks HTTP, AIMock mocks LLM)
- `*.chaos.test.ts` — resilience tests (500s, timeouts, malformed responses)

## Evals

Evalite-based LLM quality checks in `src/mastra/evals/`:

| Eval                      | Scorer                     |
| ------------------------- | -------------------------- |
| `cost-estimation.eval.ts` | `CostInRange`              |
| `tips-generation.eval.ts` | `TipsSchema`               |
| `weather-tip.eval.ts`     | `TipLength`, `Levenshtein` |

```sh
# Against a real LLM (requires OPENAI_API_KEY)
pnpm eval:run

# Against AIMock — deterministic, no API key needed
pnpm eval:aimock

# Watch mode (real LLM)
pnpm eval:dev

# Interactive results UI at http://localhost:3006
pnpm eval:serve
```

### Static HTML eval report

Export the last run to `eval-report/`:

```sh
pnpm eval:export
```

Then serve locally:

```sh
cd eval-report
npx http-server .
# Opens http://localhost:8080
```
