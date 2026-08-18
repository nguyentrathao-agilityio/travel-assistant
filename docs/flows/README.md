# Flow diagrams — for demo

| #   | Flow                                      | File                                                                 |
| --- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1   | The graph: routing, branches, supervision | [01-intent-routing-supervisor.md](./01-intent-routing-supervisor.md) |
| 2   | RAG (knowledge base)                      | [02-rag-knowledge.md](./02-rag-knowledge.md)                         |
| 3   | Long-term memory                          | [03-long-term-memory.md](./03-long-term-memory.md)                   |
| 4   | Booking handoff & human-in-the-loop       | [04-booking-handoff-hitl.md](./04-booking-handoff-hitl.md)           |
| 5   | Checkpoints & time travel                 | [05-time-travel.md](./05-time-travel.md)                             |

## System overview

```mermaid
flowchart LR
    User((User)) --> Web[apps/web\nCopilotKit UI]
    Web -->|/chat, AG-UI stream| API[apps/agent\nHono + CopilotKit runtime]
    API --> Graph[LangGraph StateGraph]
    Graph --> PG[(Postgres)]
    Graph --> LLM[(OpenAI)]

    classDef actor fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px
    classDef ui fill:#fce7f3,stroke:#db2777,color:#831843
    classDef runtime fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef graphNode fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:2px
    classDef dependency fill:#ccfbf1,stroke:#0f766e,color:#134e4a

    class User actor
    class Web ui
    class API runtime
    class Graph graphNode
    class PG,LLM dependency
```

Postgres backs three roles, one connection string (`POSTGRES_URL`):

- **Checkpointer** → per-turn graph state → [time travel](./05-time-travel.md)
- **Memory store** → cross-thread facts → [long-term memory](./03-long-term-memory.md)
- **Knowledge store** (pgvector) → grounded answers → [RAG](./02-rag-knowledge.md)
