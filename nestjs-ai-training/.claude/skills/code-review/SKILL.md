---
name: code-review
description: Read-only review of the current branch's diff against main (or a base branch passed as argument) for the Trello-lite NestJS API, checked against the project review checklist (references/checklist.md), with findings grouped as must fix / should fix / nit and anchored to file:line. Use this whenever the user asks to review the branch, review their changes, check a diff or MR before merging, self-review a ticket (the "Review" step of the workflow), or asks "anything wrong with my changes?" — even if they don't say "code review" explicitly.
context: fork
allowed-tools: Bash(git diff:*), Bash(git log:*), Read, Grep, Glob
disallowed-tools: Edit, Write
argument-hint: "[base-branch]"
---

# Code review (branch vs base)

Base branch: `$ARGUMENTS` — if empty, use `main`. Below, `<base>` means that branch.

Review what this branch changes compared to `<base>` and report problems. You are a reviewer, not an implementer: the tools you have are deliberately read-only, so never try to modify files or work around that — the author decides what to change after reading your report.

## 1. Collect the diff

Run from the repository (the `nestjs-ai-training/` app lives inside it):

```bash
git log --oneline <base>..HEAD          # commits on this branch
git diff --stat <base>...HEAD           # files touched
git diff <base>...HEAD                  # full diff (three dots = since the merge base)
```

- First check the base with `git log -1 --oneline <base>`. This repo often has no local `main` branch ("unknown revision"); then use `origin/<base>` everywhere instead.
- If `<base>..HEAD` is empty, say there is nothing to review on this branch and stop. If `git diff HEAD` shows uncommitted changes, mention them in one line but review only committed branch changes unless the user asked otherwise.
- `main` predates the whole NestJS app, so against `main` the diff is usually the entire project (dozens of files, 10k+ lines). When `--stat` shows that, say so at the top of the report and suggest re-running with the real parent branch (e.g. `/code-review feat/ai-tool-training`). Still do the review, but prioritise: source under `src/`, `prisma/` and `test/` first, docs and generated/lock files last, and focus on the checklist's must-fix items rather than nits.
- Review per file (`git diff <base>...HEAD -- <path>`) when the diff is large, so nothing gets skimmed.

## 2. Read the checklist and the surrounding code

Read `references/checklist.md` (next to this file) before judging anything — it holds the project's rules (conventions, security, tests, approval-required changes, requirement traceability).

The diff alone hides context. For each changed file, Read enough of the real file to understand it, and use Grep/Glob to check callers, existing helpers that should have been reused, matching tests, and the requirement/ticket the change claims to implement (`docs/requirements.md`, `docs/tickets/`).

## 3. Judge

Look for, in priority order: correctness bugs, security/authorization gaps, broken API contract or error envelope, missing or weakened tests, convention violations, then readability. Only report a finding you can point to in the diff and explain concretely — "what input/state leads to what wrong result". Don't report style that Prettier/oxlint would already enforce unless it's actually in the diff, and don't pad the report: an empty severity group is fine.

Severity:

- **Must fix** — bugs, security holes, data loss, broken contracts, failing/removed/weakened tests, secrets committed, changes the checklist says need approval but show no sign of it, behaviour with no `Confirmed`/`Designed` requirement behind it.
- **Should fix** — missing test cases the checklist requires, convention breaks with real cost (missing `.js` import extension, returning Prisma models, hand-built error bodies), unclear logic likely to cause bugs later, docs not updated for changed behaviour.
- **Nit** — naming, small readability or consistency points. Keep these few.

## 4. Report

Use this exact structure; `file:line` refers to the line in the new version of the file (relative to the repo root), so the author can jump straight to it.

```markdown
## Code review: <branch> vs <base>

**Scope:** <N commits, M files> — <one-sentence summary of what the branch does>

### Must fix
- `path/to/file.ts:42` — <problem>. <why it matters / failure scenario>. <suggested fix>

### Should fix
- ...

### Nit
- ...

**Checklist items not verifiable from the diff:** <e.g. "pnpm lint/test/test:e2e/build were not run (read-only review)">
```

Write "None." under an empty group. End with a one-line verdict: `Ready to merge`, `Ready after should-fix items`, or `Not ready — must-fix items open`.
