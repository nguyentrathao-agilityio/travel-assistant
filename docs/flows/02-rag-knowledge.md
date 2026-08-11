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
```

**Key files**: `knowledge/sources.ts`, `knowledge/loader.ts`, `knowledge/ingestion.ts`,
`knowledge/retrieval.ts`, `tools/knowledge.ts`, `infrastructure/persistence/knowledge-store.ts`.
