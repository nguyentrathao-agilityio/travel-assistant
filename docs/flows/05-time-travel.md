# Flow 5 — Checkpoints & time travel

Every state update rides on a checkpoint. Selected flight, hotel, and place IDs live in state
(`flights`, `hotel`, `selectedOptions`) and are checkpointed via `PostgresSaver`, persisting across
the deployed app until the Itinerary Summary is generated.

```mermaid
flowchart LR
    Node[Any node runs] --> Update[Return partial state update] --> CP[(PostgresSaver\ncheckpoint)]
    CP -->|thread_id| Resume["Resume next request\n/ after restart"]
    CP -->|getHistory| TT["Time travel:\nreplay or fork"]

    classDef process fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef storage fill:#ccfbf1,stroke:#0f766e,color:#134e4a,stroke-width:2px
    classDef timeTravel fill:#dbeafe,stroke:#2563eb,color:#1e3a8a

    class Node,Update process
    class CP storage
    class Resume,TT timeTravel
```

`TimeTravelPanel` (frontend) reads a thread's checkpoint history and lets you replay from one, or
fork by injecting a new message at that point — old branch stays, new branch starts from the same
checkpoint.

```mermaid
flowchart LR
    T1[checkpoint N] -->|replay| T1
    T1 -->|fork with new message| T2["checkpoint N'\n(alt branch)"]

    classDef current fill:#ccfbf1,stroke:#0f766e,color:#134e4a,stroke-width:2px
    classDef alternate fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px

    class T1 current
    class T2 alternate
```

**Key files**: `apps/agent/src/agent.ts` (`PostgresSaver.fromConnString`),
`apps/web/src/components/chat/TimeTravelPanel/index.tsx` (`threads.getHistory`, `runs.wait`).
