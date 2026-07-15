# Frontend AI — Instructions

> Read this file first. Then load the docs listed for your task before writing any code.

## Task → Docs

| Task                                     | Read in order                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Build new component, hook, page, feature | `.claude/docs/SHARED.md` → `.claude/docs/IMPLEMENT.md` → `.claude/docs/REVIEW.md` |
| Add Mastra tool or CopilotKit action     | `.claude/docs/SHARED.md` → `.claude/docs/IMPLEMENT.md` → `.claude/docs/REVIEW.md` |
| Fix, debug, or patch existing code       | `.claude/docs/SHARED.md` → `.claude/docs/FIX_BUGS.md` → `.claude/docs/REVIEW.md`  |
| Review or audit code                     | `.claude/docs/SHARED.md` → `.claude/docs/REVIEW.md`                               |
| Unsure                                   | Read `.claude/docs/SHARED.md` → re-read this table                                |

`REVIEW.md` is always last — run the checklist before every response.

## Always Active

- Never redefine what already exists — search first
- Never change unrelated code
- Confirm a plan before modifying existing files
- Named exports only (except Next.js pages/layouts)
- Barrel imports: `@/utils`, `@/components/common` — never deep paths
- `lucide-react` for all icons
- No hardcoded colors — CSS variables + Tailwind tokens only
- Zod `safeParse` for all external data — throw on failure
- `REVIEW.md` checklist before every response — no exceptions
