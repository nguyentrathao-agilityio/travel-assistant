# Travel Planner Assistant

## Overview

Welcome to Travel Planner Assistant - an AI-powered travel planning application built with modern agentic technologies including CopilotKit, AG-UI, and Mastra. This project demonstrates advanced AI application development practices such as conversational interfaces, streaming UI responses, multi-tool orchestration, itinerary generation, and Generative UI experiences.

## Target

The aim of this project is to build a realistic AI-powered travel planning assistant while helping developers understand modern agentic application architecture and collaborative development workflows.

Specific learning objectives:

- Build AI-powered applications using CopilotKit
- Understand AG-UI streaming events and workflows
- Create conversational chatbot experiences with streaming responses
- Orchestrate multiple tools within a single AI agent workflow
- Build progressive Generative UI components
- Integrate external APIs into AI-powered applications
- Understand conversational memory and persistence
- Manage monorepo applications using TurboRepo
- Build scalable frontend/backend AI architectures
- Collaborate effectively in a team-based environment

## Team Size

- 3 Developers:
  - Huong.Le
  - My.Le
  - Nguyen.ThaoTra

## Prerequisite

- **Visual Studio Code**
- **Node.js** v24+
- **pnpm** v10.33.4+
- **PostgreSQL** (for agent persistence)
- **Git** (for version control and Husky hooks)

## Technical Stacks

- **React + Vite**
- **TypeScript**
- **TurboRepo**
- **CopilotKit**
- **AG-UI**
- **Mastra**
- **TailwindCSS**
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

## Folder Structure

```bash
travel-planner-assistant/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       │   ├── chat/
│   │       │   ├── common/
│   │       │   ├── FlightCard/
│   │       │   ├── HotelCard/
│   │       │   ├── WeatherCard/
│   │       │   ├── RouteCard/
│   │       │   ├── PlacesCard/
│   │       │   ├── LocalTipsCard/
│   │       │   └── TripSummaryCard/
│   │       ├── constants/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── schemas/
│   │       ├── stores/
│   │       ├── styles/
│   │       ├── types/
│   │       └── utils/
│   │
│   ├── agent/
│   │   └── src/
│   │       └── mastra/
│   │           ├── agents/
│   │           ├── prompts/
│   │           ├── schemas/
│   │           ├── services/
│   │           ├── tools/
│   │           ├── utils/
│   │           └── workflows/
│   │
│   └── storybook/
│       └── src/
│
├── packages/
│   ├── eslint-config/
│   ├── schemas/
│   ├── types/
│   └── typescript-config/
│
├── .husky/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

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
# CopilotKit runtime — Mastra exposes this via registerCopilotKit()
VITE_RUNTIME_URL=http://localhost:4111/chat

# Mastra REST base — used by mastraClient (thread list, message fetch, etc.)
VITE_MASTRA_URL=http://localhost:4111

# CopilotKit public license key — required for premium features
VITE_COPILOTKIT_PUBLIC_LICENSE_KEY=
```

**Notes:**

- The frontend application runs on `http://localhost:3000`
- The Mastra agent server runs on `http://localhost:4111`
- CopilotKit runtime endpoint: `http://localhost:4111/chat`

## Features Documentation

### AI Chat Features

- **Conversational Chatbot**: AI-powered travel assistant interface
- **Streaming Responses**: Real-time AG-UI response streaming
- **Conversation Memory**: Multi-turn context handling with PostgreSQL persistence
- **Generative UI**: Progressive UI rendering during tool execution

### Travel Features

- **Weather Check**: Live destination weather lookup
- **Route Recommendation**: Smart city route planning
- **Flight Booking**: Simulated flight browsing and booking
- **Hotel Booking**: Simulated hotel recommendation system
- **Places Discovery**: Attractions and hidden gems exploration
- **Local Tips**: Practical travel and cultural advice

### Itinerary Features

- **Full Travel Schedule**: Complete day-by-day itinerary generation
- **Booking Coordination**: Flights and hotels integrated into schedules
- **Daily Recommendations**: Suggested attractions and activities
- **Interactive Planning**: Modify and refine generated itineraries

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
- [Mastra Documentation](https://mastra.ai/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [OpenAI Platform](https://platform.openai.com/docs)
- [Vitest Documentation](https://vitest.dev) — Testing framework
