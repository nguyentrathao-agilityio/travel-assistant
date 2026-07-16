# Travel Planner Assistant

## Overview

Welcome to Travel Planner Assistant - an AI-powered travel planning application that simulates a real-world AI travel assistant, helping users plan complete travel experiences through a conversational chatbot interface — from checking the weather at a destination to generating a full multi-day trip schedule with flights, hotels, and local tips.

The practice focuses primarily on building the agent logic and orchestration layer using **LangChainJS** and **LangGraph** — covering agent/tool/model interaction, schema-validated responses, context management, middleware, and graph-based multi-step orchestration with state persistence and interrupt handling. **CopilotKit** and **AG-UI** are used as the supporting frontend/streaming layer to connect this agent logic to a conversational chatbot interface with real-time streaming responses and generative UI.

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
# CopilotKit runtime endpoint exposed by the agent server
VITE_RUNTIME_URL=http://localhost:4111/chat

# Agent server REST base — used for thread list, message fetch, etc.
VITE_MASTRA_URL=http://localhost:4111

# CopilotKit public license key — required for premium features
VITE_COPILOTKIT_PUBLIC_LICENSE_KEY=
```

**Notes:**

- The frontend application runs on `http://localhost:3000`
- The agent server runs on `http://localhost:4111`
- CopilotKit runtime endpoint: `http://localhost:4111/chat`

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
