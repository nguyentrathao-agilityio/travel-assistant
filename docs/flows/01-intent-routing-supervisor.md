# Flow 1 — The graph: routing, branches, supervision

`apps/agent/src/agent.ts`

## The graph

One graph, a shared supervisor, six agent branches, and one deterministic refusal branch. Every
message enters through `classify` and leaves through `saveMemory` — except `out_of_scope`, which
leaves through `refusal` directly.

```mermaid
flowchart TD
    START((START)) --> classify
    classify --> explore & plan & bookFlight & bookHotel & cancelBooking & general
    classify --> refusal
    explore & plan & bookFlight & bookHotel & cancelBooking & general --> supervise
    supervise --> saveMemory --> END((END))
    refusal --> END

    classDef boundary fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px
    classDef routing fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px
    classDef agent fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef control fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:2px
    classDef persistence fill:#ccfbf1,stroke:#0f766e,color:#134e4a
    classDef danger fill:#fee2e2,stroke:#dc2626,color:#7f1d1d

    class START,END boundary
    class classify routing
    class explore,plan,bookFlight,bookHotel,cancelBooking,general agent
    class supervise control
    class saveMemory persistence
    class refusal danger
```

- **Entry** — `classify` routes on intent via `Command.goto`
- **Branches** — explore, plan, bookFlight, bookHotel, cancelBooking, general
- **Refusal** — `out_of_scope` routes straight to `refusal`, skipping supervise and saveMemory entirely
- **Retry** — explore & plan only, max 2 attempts
- **Handoff** — plan → booking branch
- **Exit** — supervise → saveMemory (best effort) → end; refusal → end directly

## Routing

`nodes/classify.ts` — a single structured-output call reads the message and routes with
`Command.goto`, every turn. No separate conditional-edge logic to keep in sync.

```mermaid
flowchart LR
    classify -.-> explore
    classify -.-> plan
    classify -.-> bookFlight
    classify -.-> bookHotel
    classify -.-> cancelBooking
    classify -.-> general
    classify -.-> refusal

    classDef routing fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px
    classDef agent fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef danger fill:#fee2e2,stroke:#dc2626,color:#7f1d1d

    class classify routing
    class explore,plan,bookFlight,bookHotel,cancelBooking,general agent
    class refusal danger
```

## Branches

`utils/create-agent.ts` — every branch is built by the same `createSpecializedAgent` factory; each
just gets its own prompt section and a restricted tool set.

| Branch        | Tools                                                   |
| ------------- | ------------------------------------------------------- |
| explore       | destinations · places · local tips · RAG knowledge base |
| plan          | flights · hotels · routes · weather                     |
| bookFlight    | revalidate → human approval → submit                    |
| bookHotel     | revalidate → human approval → submit                    |
| cancelBooking | retrieve → human approval → cancel                      |
| general       | open travel conversation, no side effects               |

## Refusal

`nodes/refusal.ts` — not built by `createSpecializedAgent`: a plain function, no model call, no
tools. `classify` already produces a language-matched `refusalMessage` in its one structured-output
call whenever it classifies `out_of_scope`; `refusal` just replies with that message and ends the
turn, bypassing `supervise` and `saveMemory`.

## Supervision

`nodes/supervise.ts` — every branch, not just booking, flows into `supervise`. It validates the
result, then `routeAfterSupervisor` decides what happens next.

```mermaid
flowchart LR
    supervise -->|retry, max 2x| ExplorePlan[explore / plan]
    supervise -->|handoffTarget set| Booking[booking branch]
    supervise -->|complete, failed, or out of retries| saveMemory

    classDef control fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:2px
    classDef agent fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef persistence fill:#ccfbf1,stroke:#0f766e,color:#134e4a

    class supervise control
    class ExplorePlan,Booking agent
    class saveMemory persistence
```

> A booking that times out is marked `WRITE_STATUS_UNKNOWN` and never auto-retried — the side effect
> may already have happened, so it isn't worth guessing on.
