---
name: release-checklist
description: Pre-merge release checklist for a Trello-lite ticket branch (feat/tl-xxx-…) before its merge request into feat/ai-tool-training. Runs the verification commands (lint, unit, e2e, build), checks git state against the target branch, scans the diff for risky changes (focused/skipped tests, debug output, secrets, schema without migration, new env vars, dependency changes, requirement IDs in code), and checks the ticket and docs are up to date, then reports a ready/not-ready verdict. Use this whenever the user asks whether a branch or MR is ready to merge, wants a pre-merge or release check, says "check before I open the MR", "can I merge TL-007?", "is this ticket done?", or finishes the Verify/Review step of a ticket — even if they don't say "checklist".
argument-hint: "[target-branch]"
---

# Release checklist (ticket branch → target)

Target branch: `$ARGUMENTS` — if empty, use `feat/ai-tool-training`. Below, `<target>` means that branch.

The goal is a trustworthy answer to "can this MR be merged?". Every row of the report must come from something you actually ran or read in this session. A check you could not run is reported as not run, never as passed — a false "ready" is far more costly than an honest "couldn't verify".

This is a check, not a fix-up pass. Don't commit, push, merge, rebase, run migrations, or edit code. If something fails, report it with the evidence and let the author decide. (Running the test suites is fine: e2e tests use their own `_test` database.)

The app lives in `nestjs-ai-training/` inside the git repo. Run `pnpm` commands from there.

## 1. Identify the branch, ticket and target

```bash
git rev-parse --abbrev-ref HEAD
git log -1 --oneline <target>          # if "unknown revision", use origin/<target>
git log --oneline <target>..HEAD
```

- The ticket number comes from the branch name (`feat/tl-007-invitations` → `TL-007`); the ticket file is `nestjs-ai-training/docs/tickets/TL-007-*.md`. If the branch name has no ticket number, ask which ticket it belongs to, or continue without the ticket section and say so.
- If `<target>..HEAD` is empty, there is nothing to merge: say so and stop.

## 2. Git state

```bash
git status --porcelain
GIT_SSH_COMMAND="ssh -o ConnectTimeout=10" git fetch origin --quiet
git rev-list --left-right --count origin/<target>...HEAD   # behind / ahead
git merge-tree --write-tree origin/<target> HEAD            # non-zero exit + "CONFLICT" lines = conflicts
```

- Uncommitted changes: list them. The checks below run on the working tree, so results may not match what was pushed.
- The fetch talks to GitLab over SSH and sometimes times out. If it fails, use the local `<target>` / `origin/<target>`, and mark the "up to date" row as unverified because the remote could not be reached.
- Behind the target is a warning (rebase or merge needed before merging), not a failure. Conflicts are a failure.

## 3. Verification commands

Run each one and record the exit code plus the summary line (`Tests: N passed`, error count):

```bash
cd nestjs-ai-training
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
npx prettier --check "src/**/*.ts" "test/**/*.ts"
```

- `pnpm test:e2e` needs PostgreSQL and `TEST_DATABASE_URL`. If it fails before running any test (connection refused, env missing), report it as not run, give the reason, and suggest `docker compose up -d`. Don't treat it as passed, and don't treat an environment problem as a test failure either.
- A real failure: show the failing test names or the first errors, not the whole log.
- Run `prettier --check`, never `pnpm format`, which rewrites files.

## 4. Diff checks

Run the bundled script `scripts/diff_checks.sh` (in this skill's directory), from anywhere inside the repo. It scans only what this branch changes, plus uncommitted edits:

```bash
bash <this-skill-dir>/scripts/diff_checks.sh origin/<target>   # or the local <target> if there is no origin/<target>
```

Each output line is `FAIL|WARN|INFO <check>: <detail>`. Carry its findings into the report. Then check the items a script can't judge by reading the changed files:

- **New or changed endpoints** (controllers in the diff): Swagger decorators per the CLAUDE.md conventions (`@ApiTags`, `@ApiOperation`, one response decorator per documented status, `@ApiBearerAuth()` on guarded controllers), and e2e coverage of the happy path, 400, 401, and access to another user's resource (403/404).
- **Approval-required changes** listed in CLAUDE.md "Ask for approval before": schema or migrations, dependencies, auth behaviour, changed public API contract, build/lint/test config. These aren't failures by themselves. Flag each one as "needs confirmed approval", and look for evidence of approval in the ticket (for example "Plan: written and approved (schema)").

## 5. Ticket and docs

Read the ticket file and `nestjs-ai-training/docs/tickets/README.md`:

- Ticket **Status** is `In review` (or `Done` if the team marks it on merge). `Draft`, `Ready` or `In progress` means not ready.
- Every **Acceptance criteria** box and every **Workflow checklist** box is ticked. An unticked box is a failure unless the ticket's Notes explain why.
- The ticket's status in the README index matches the ticket file.
- **Blocking questions** is `none` or lists only answered questions.
- If the branch adds a new module, endpoint group or model: `docs/architecture.md` and the Architecture section of `CLAUDE.md` mention it. A missing mention is a warning.

## 6. Report

Write the report in the language the user is writing in. Use this structure:

```markdown
# Release checklist: <branch> → <target>

**Verdict:** ✅ Ready to merge | ❌ Not ready (<n> blockers) | ⚠️ Ready with caveats

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Working tree clean | ✅ | `git status` empty |
| 2 | Up to date with target | ⚠️ | 2 commits behind origin/<target> |
| … | | | |

## Blockers
- <what failed, the evidence, and what would fix it>

## Needs a human decision
- <approval-required changes, unverified rows>
```

- Result symbols: ✅ passed, ❌ failed, ⚠️ warning, ⏭️ not run (with the reason).
- The verdict is ❌ if any row is ❌. It is ⚠️ if there are warnings, not-run rows or approvals still needed. It is ✅ only when every row passed.
- Keep evidence short: an exit code, a count, a `file:line`. Leave out full logs.
- End with the next steps, for example "rebase on origin/<target>, then re-run the checklist". Don't do those steps yourself.
