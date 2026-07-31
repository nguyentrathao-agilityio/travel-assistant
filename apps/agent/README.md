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

The explore and plan branches search an allow-listed travel knowledge base using hybrid semantic
and lexical retrieval, metadata filters, a minimum relevance threshold, and citations. The
ingestion command fetches official sources, removes executable markup, splits content into
overlapping chunks, embeds `title` and `content`, and synchronizes those chunks to a
pgvector-indexed `PostgresStore`.

Live prices, availability, schedules, weather, and routes continue to use dedicated tools.

## Development

```sh
pnpm db:setup            # create/migrate checkpoint, store, and pgvector tables
pnpm db:seed-knowledge   # fetch, chunk, embed, and sync allow-listed sources
KNOWLEDGE_SOURCE_ID=vn-evisa-official pnpm db:seed-knowledge # refresh one source
pnpm dev                 # tsc + langgraphjs dev server on :8123
pnpm build               # production build (tsc + tsc-alias)
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
