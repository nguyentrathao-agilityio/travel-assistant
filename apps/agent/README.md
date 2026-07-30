# Agent

LangGraph-powered travel agent. Handles flight search, hotel search, route planning, weather, local tips, destination exploration, trip summary, and flight/hotel booking (with human-in-the-loop approval).

## Stack

- **LangGraph.js** — `StateGraph` orchestration, Postgres-backed checkpointing/interrupts
- **PostgreSQL** — checkpoint storage (`POSTGRES_URL`)
- **OpenAI** — `gpt-4o-mini` for chat and intent classification
- **CopilotKit** — `/chat` route exposes the agent to the frontend via AG-UI

## Environment variables

| Variable                 | Required | Description                                            |
| ------------------------ | -------- | ------------------------------------------------------ |
| `OPENAI_API_KEY`         | yes      | Used for chat and intent classification                |
| `POSTGRES_URL`           | yes      | PostgreSQL connection string (checkpointing)           |
| `OPENAI_MODEL`           | no       | Override chat model (default `openai/gpt-4o-mini`)     |
| `OPENAI_EMBEDDING_MODEL` | no       | RAG embedding model (default `text-embedding-3-small`) |
| `LANGSMITH_API_KEY`      | for dev  | `langgraph up` needs a LangSmith deployment to run     |

## Knowledge RAG

The explore and plan branches can search a trusted travel knowledge corpus using hybrid semantic
and lexical retrieval with metadata filters and citations. Live prices, availability, schedules,
weather, and routes continue to use dedicated tools. See
[`docs/travel-rag-plan.md`](../../docs/travel-rag-plan.md) for the architecture and rollout plan.

## Development

```sh
pnpm db:setup     # one-time: create/migrate Postgres checkpoint tables
pnpm dev          # tsc + langgraphjs dev server on :8123
pnpm build        # production build (tsc + tsc-alias)
```

## Tests

```sh
pnpm test         # run all unit tests (Vitest)
pnpm test:watch   # watch mode
```

An HTML report is written to `test-report/index.html` after every run:

```sh
cd test-report
npx http-server .
# Opens http://localhost:8080
```

Test files live alongside their source under `src/**/__tests__/`.
