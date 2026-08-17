# Flow 2 — RAG (knowledge base)

Grounds `explore` / `plan` answers in real documents instead of model improvisation.

```mermaid
flowchart TD
    subgraph Ingest["Ingest-time — offline script (db:seed-knowledge)"]
        A[Knowledge sources] --> B[Load + chunk] --> C[Embed]
    end
    C --> Store[(knowledgeStore\npgvector)]

    subgraph Query["Query-time — per request"]
        D[explore / plan agent] --> E[knowledgeSearchTool] --> F["Hybrid search\n(vector + lexical fallback)"] --> G[Filter, rank, cite]
    end
    Store --> F
    G --> H[Result feeds next model step]

    classDef source fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef process fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef storage fill:#ccfbf1,stroke:#0f766e,color:#134e4a,stroke-width:2px
    classDef result fill:#dcfce7,stroke:#16a34a,color:#14532d

    class A,D source
    class B,C,E,F,G process
    class Store storage
    class H result
```

**Key files**: `knowledge/sources.ts`, `knowledge/loader.ts`, `knowledge/ingestion.ts`,
`knowledge/retrieval.ts`, `tools/knowledge.ts`, `infrastructure/persistence/knowledge-store.ts`.
