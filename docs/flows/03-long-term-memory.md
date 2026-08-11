# Flow 3 — Long-term memory

Two memories, two lifetimes.

```mermaid
flowchart LR
    subgraph Short["Short-term — per thread"]
        N[Every node] -->|read / write every turn| CP[(PostgresSaver\ncheckpoint)]
    end

    subgraph Long["Long-term — cross-thread"]
        SM[saveMemory node] -->|extract + save after every turn| MS[(PostgresStore\nns: memories)]
        PA[plan agent] -->|searchMemories every model call| MS
    end
```

- **Short-term** — every node reads/writes the PostgresSaver checkpoint each turn.
- **Long-term** — `saveMemory` extracts preferences after every turn into `PostgresStore`; `plan`
  calls `searchMemories()` on every model call to recall them.

**Key files**: `nodes/save-memory.ts`, `services/memory.ts`, `infrastructure/persistence/memory-store.ts`,
`utils/create-agent.ts`.
