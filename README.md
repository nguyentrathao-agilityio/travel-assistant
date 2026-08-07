# Travel Planner Assistant

## Overview

Welcome to Travel Planner Assistant - an AI-powered travel planning application that simulates a real-world AI travel assistant, helping users plan complete travel experiences through a conversational chatbot interface — from checking the weather at a destination to generating a full multi-day trip schedule with flights, hotels, and local tips.

The practice focuses primarily on building the agent logic and orchestration layer using **LangChainJS** and **LangGraph** — covering agent/tool/model interaction, schema-validated responses, context management, middleware, and graph-based multi-step orchestration with state persistence and interrupt handling. **CopilotKit** and **AG-UI** are used as the supporting frontend/streaming layer to connect this agent logic to a conversational chatbot interface with real-time streaming responses and generative UI.

## Architecture

The current agent is a custom LangGraph workflow: a classifier routes to one of six specialized
agent branches, and every branch's result is checked by a shared `supervise` node before the
graph decides whether to retry, hand off, or finalize:

```mermaid
%%{init: {"flowchart": {"curve": "basis", "nodeSpacing": 32, "rankSpacing": 55}}}%%
flowchart LR
    START(("▶️<br/>START")) --> CLASSIFY{{"🧭 Classify intent"}}

    subgraph ROUTES[" 🧩 Specialized agent branches "]
        direction TB
        EXPLORE("🗺️ <b>Explore</b><br/>Destinations · Places · Tips · RAG")
        PLAN("🧳 <b>Plan</b><br/>Flights · Hotels · Routes · Weather")
        BOOK_FLIGHT("✈️ <b>Book flight</b><br/>Revalidate · Approve · Submit")
        BOOK_HOTEL("🏨 <b>Book hotel</b><br/>Revalidate · Approve · Submit")
        CANCEL("🚫 <b>Cancel booking</b><br/>Retrieve · Approve · Cancel")
        GENERAL("💬 <b>General</b><br/>Travel conversation")
    end

    CLASSIFY -->|explore| EXPLORE
    CLASSIFY -->|plan| PLAN
    CLASSIFY -->|book_flight| BOOK_FLIGHT
    CLASSIFY -->|book_hotel| BOOK_HOTEL
    CLASSIFY -->|cancel_booking| CANCEL
    CLASSIFY -->|"general / fallback"| GENERAL

    EXPLORE --> SUPERVISE{{"🛡️ Supervise<br/>validate · retry · route"}}
    PLAN --> SUPERVISE
    BOOK_FLIGHT --> SUPERVISE
    BOOK_HOTEL --> SUPERVISE
    CANCEL --> SUPERVISE
    GENERAL --> SUPERVISE

    SUPERVISE -. "🔁 retry ≤2 (explore/plan)" .-> EXPLORE
    SUPERVISE -. "🔁 retry ≤2 (explore/plan)" .-> PLAN
    SUPERVISE -. "↪️ handoff" .-> BOOK_FLIGHT
    SUPERVISE -. "↪️ handoff" .-> BOOK_HOTEL

    SUPERVISE --> MEMORY("🧠 <b>Save memory</b><br/>best effort")
    MEMORY --> END((("⏹️<br/>END")))

    classDef terminal fill:#1e293b,color:#f8fafc,stroke:#38bdf8,stroke-width:2.5px;
    classDef router fill:#fef9c3,color:#713f12,stroke:#eab308,stroke-width:2.5px;
    classDef readAgent fill:#e0f2fe,color:#075985,stroke:#0284c7,stroke-width:1.5px;
    classDef actionAgent fill:#ffe4e6,color:#9f1239,stroke:#e11d48,stroke-width:1.5px;
    classDef memory fill:#dcfce7,color:#14532d,stroke:#16a34a,stroke-width:2.5px;
    classDef routesBox fill:transparent,stroke:#94a3b8,stroke-width:1.5px,stroke-dasharray:4 3,color:#475569;

    class START,END terminal;
    class CLASSIFY,SUPERVISE router;
    class EXPLORE,PLAN,GENERAL readAgent;
    class BOOK_FLIGHT,BOOK_HOTEL,CANCEL actionAgent;
    class MEMORY memory;
    class ROUTES routesBox;

    linkStyle default stroke:#94a3b8,stroke-width:1.5px;
```

- `classify` uses structured output to identify the user's intent and routes with
  `Command.goto`.
- Each business branch is a LangChain agent graph with a domain-specific prompt and restricted
  tool set.
- Every branch feeds into a single `supervise` node ([`apps/agent/src/nodes/supervisor.ts`](apps/agent/src/nodes/supervisor.ts)), which validates the branch's result (tool failures, missing required fields, missing operations) and decides the next hop via `routeAfterSupervisor`.
- `explore` and `plan` get automatic retries (up to `MAX_RETRIES_PER_NODE`, currently 2) when the supervisor judges the result retryable; other branches don't retry.
- `plan` requests a booking handoff by setting `handoffTarget` in state — the supervisor reads it and routes straight to `bookFlight` or `bookHotel` instead of falling through to `saveMemory`.
- Booking and cancellation tools pause with a LangGraph interrupt and require explicit human
  approval before producing a side effect.
- `PostgresSaver` persists per-thread checkpoints so conversations and interrupted runs can
  resume.
- `saveMemory` extracts durable travel preferences into a PostgreSQL-backed store after the
  supervisor finalizes the turn.
- CopilotKit and AG-UI stream tool artifacts to the React frontend, where domain hooks render
  interactive cards.

The main implementation entry points are:

- [`apps/agent/src/agent.ts`](apps/agent/src/agent.ts) — parent graph
- [`apps/agent/src/nodes/`](apps/agent/src/nodes) — classification, supervision/routing, and memory
- [`apps/agent/src/agents/`](apps/agent/src/agents) — the specialized agent branches (`explore`, `plan`, booking, `general`)
- [`apps/agent/src/tools/`](apps/agent/src/tools) — agent-facing tool contracts
- [`apps/agent/src/services/`](apps/agent/src/services) — domain and external API logic
- [`apps/web/src/hooks/`](apps/web/src/hooks) — CopilotKit tool renderers, state sync, and approval UI

## Target

The aim of this project is to build a realistic AI-powered travel planning assistant while helping developers understand modern agentic application architecture and collaborative development workflows.

**LangChainJS**

- Grasp how Agents, Models, and Tools interact to build intelligent workflows.
- Design predictable responses using message templates and schema validation.
- Manage conversational context effectively.
- Apply prebuilt and custom middleware for enhanced control and extensibility.
- Improve user experience through real-time event streaming.

**LangGraph**

- Orchestrate multi-step logic using graph-based execution.
- Ensure long-running tasks and state recovery.
- Handle interrupts and time travel — debug or rewind execution flows safely.
- Build integrated AI systems — combine LangChainJS logic with LangGraph orchestration for scalable, maintainable AI solutions.

## Team Size

- 1 Developer:
  - Nguyen.TraThao

## Prerequisite

- **Visual Studio Code**
- **Node.js** v24.15.0
- **pnpm** v11.1.1
- **PostgreSQL** (for agent persistence)
- **Git** (for version control and Husky hooks)
- **LLM**: gpt-4o mini

## Development Tools

- **Husky**
- **Prettier**
- **ESLint**
- **CommitLint**

## Technical Stacks

- **TypeScript** v5.9.3
- **React + Vite**
- **TurboRepo**
- **CopilotKit** v1.57.1
- **AG-UI** v1.0.2
- **LangChain** v1.1.48
- **LangGraph** v1.3.4
- **LangSmith**
- **TailwindCSS** v4.3
- **OpenAI GPT-4o Mini**
- **PostgreSQL**

## Features

- **Weather Check** — Users can check the current weather, temperature, and travel forecast for any destination through a Generative UI weather card.

- **Route Recommendation** — Users can request recommended travel routes with ordered landmarks, travel times, local tips, food suggestions, and transport options.

- **Flight Booking** — Users can browse simulated flight options with airline, pricing, schedule, and duration information through interactive booking cards.

- **Hotel Booking** — Users can explore simulated hotel recommendations based on budget and preferences, including ratings, amenities, and booking actions.

- **Places To Check** — Users can discover attractions, landmarks, and hidden gems with descriptions, categories, and estimated visit durations.

- **Local Tips** — Users can receive practical travel advice including etiquette, currency, transportation, and food recommendations.

- **Full Travel Schedule Setup** — Users can generate a complete travel itinerary combining flights, hotels, attractions, local tips, and day-by-day travel schedules through a Generative UI experience.

- **Smart Thread Management** — Empty threads are prevented from being created; users are redirected to existing empty threads when clicking "New Conversation" on another thread, eliminating clutter.

## Step by Step to Run This App in Your Local

| Command                                              | Action                           |
| ---------------------------------------------------- | -------------------------------- |
| `git clone <your-repository-url>`                    | Download the source code         |
| `cd travel-planner-assistant`                        | Move to project folder           |
| `pnpm install`                                       | Install dependencies             |
| `cp apps/agent/.env.example apps/agent/.env`         | Create backend environment file  |
| `cp apps/web/.env.local.example apps/web/.env.local` | Create frontend environment file |
| _Configure your environment variables_               | Add required API keys            |
| `pnpm dev`                                           | Start development environment    |
| `pnpm test`                                          | Run Jest tests (via Vitest)      |

### Environment Variables

Create the following environment files:

### `apps/agent/.env`

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional — defaults to openai/gpt-4o-mini
OPENAI_MODEL=openai/gpt-4o-mini

# Required — PostgreSQL database for memory and storage
POSTGRES_URL=postgresql://user:password@localhost:5432/travel_assistant
```

### `apps/web/.env.local`

```env
# CopilotKit runtime endpoint exposed by the LangGraph agent server
VITE_RUNTIME_URL=http://localhost:8123/chat

# CopilotKit public license key — required for premium features
VITE_COPILOTKIT_PUBLIC_LICENSE_KEY=
```

**Notes:**

- The frontend application runs on `http://localhost:3000`
- The agent server (LangGraph) runs on `http://localhost:8123`
- CopilotKit runtime endpoint: `http://localhost:8123/chat`

## TurboRepo Commands

This project uses TurboRepo for monorepo management:

```bash
# Build all applications
pnpm build

# Development mode for all apps
pnpm dev

# Development mode for frontend only
pnpm --filter web dev

# Development mode for agent only
pnpm --filter agent dev

# Run linting
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# TypeScript type checking
pnpm typecheck

# Run tests (Jest via Vitest)
pnpm test

# Run tests with coverage
pnpm test:coverage

# Storybook development
pnpm storybook

# Build Storybook
pnpm build-storybook
```

## Development Workflow

This project follows modern collaborative development practices:

1. Create a feature branch from `dev`
2. Follow Conventional Commit standards
3. Ensure linting and type checks pass: `pnpm typecheck && pnpm lint`
4. Run tests before opening PRs: `pnpm test` (Jest via Vitest)
5. Open Pull Requests for review
6. Collaborate through pair programming practices
7. Maintain clean monorepo architecture

### Testing Strategy

Jest (via Vitest) for unit and component tests

## Helpful Links

- [Vite Documentation](https://vitejs.dev/guide/)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [AG-UI Documentation](https://docs.ag-ui.com)
- [LangChainJS Documentation](https://js.langchain.com/docs)
- [LangGraphJS Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangSmith Documentation](https://docs.smith.langchain.com)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [OpenAI Platform](https://platform.openai.com/docs)
- [Vitest Documentation](https://vitest.dev) — Testing framework
