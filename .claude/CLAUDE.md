# Frontend AI — Instructions

> Read this file first. Then load the docs listed for your task before writing any code.

## Task → Docs

| Task                                                                                                     | Read in order                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build new component, hook, page, feature                                                                 | `.claude/docs/shared.md` → `.claude/docs/implement.md` → `.claude/docs/review.md`                                                                                           |
| Add a new agent tool/domain (new capability end-to-end)                                                  | Skill `add-agent-tool` → `.claude/docs/shared.md` → `.claude/docs/implement.md` → `.claude/docs/review.md`                                                                  |
| Add a single backend tool (no new frontend domain/card)                                                  | Skill `create-tool` → `.claude/docs/review.md`                                                                                                                              |
| Add/modify a CopilotKit action for an existing tool                                                      | `.claude/docs/shared.md` → `.claude/docs/implement.md` → `.claude/docs/review.md`                                                                                           |
| Fix, debug, or patch existing code                                                                       | `.claude/docs/shared.md` → `.claude/docs/fix-bugs.md` → `.claude/docs/review.md`                                                                                            |
| Debug a misbehaving LangGraph run (tool not called, HITL gate silent, state lost, persistence confusion) | Skill `debug-graph` → `.claude/docs/fix-bugs.md`                                                                                                                            |
| Review or audit code                                                                                     | `.claude/docs/shared.md` → `.claude/docs/review.md`; if the diff touches a LangGraph tool, CopilotKit action, or generative card, also run Skill `review-copilotkit-layers` |
| Unsure                                                                                                   | Read `.claude/docs/shared.md` → re-read this table                                                                                                                          |

`review.md` is always last — run the checklist before every response.

Before implementing or reviewing any agent-tool integration (LangGraph tool → CopilotKit action → generative card), invoke the relevant Skill above via the Skill tool. The `.claude/docs/*` guides are generic across the frontend; the skills encode this stack's specific failure modes (e.g. the LangChain tool contract requiring a stringified return, the dual `langgraph`/`mastra` backend trees) that the generic guides don't cover.

## Always Active

- Never redefine what already exists — search first
- Never change unrelated code
- Confirm a plan before modifying existing files
- Named exports only — `apps/web` is a Vite SPA, not Next.js, so there's no pages/layouts exception
- Barrel imports: `@/utils`, `@/components/common` — never deep paths
- `lucide-react` for all icons
- No hardcoded colors — CSS variables + Tailwind tokens only
- Zod `safeParse` for all external data — throw on failure
- LangChain tools (`apps/agent/src/langgraph/tools/`) must `return JSON.stringify(result)` — a string, not an object; TypeScript won't catch a plain-object return here
- `review.md` checklist before every response — no exceptions
