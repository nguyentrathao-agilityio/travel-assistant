---
name: clean-comments
description: Removes unnecessary comments from the uncommitted diff (comments restating code, changelog-style comments, commented-out code). Only run when the user calls /clean-comments.
disable-model-invocation: true
allowed-tools: Bash(git diff *) Bash(git status *) Read Edit
disallowed-tools: Write
argument-hint: '[file or folder, default: whole diff]'
---

# Clean comments in the uncommitted diff

Uncommitted changes (scope: `$ARGUMENTS`, empty = whole diff):

!`git diff HEAD --unified=0 -- $ARGUMENTS`

## Scope — what you may touch

Only comments on lines **added** in the diff above (lines starting with `+`, excluding the `+++` header). Everything else is off limits:

- Comments that already existed in `HEAD` stay exactly as they are, even if they look redundant — they were reviewed and committed already, and changing them would add noise to someone else's history.
- Code is never changed. When a comment trails code on the same line (`foo(); // bar`), remove only the comment and the whitespace before it; the code part must stay byte-for-byte identical.
- When removing a comment that sat alone on its line, delete the whole line. If that leaves two blank lines in a row that you introduced, drop one.

The diff uses `--unified=0`, so Read the file around each hunk before deciding — a comment's value depends on the code it sits on.

Untracked files are not in `git diff HEAD`. Run `git status --short` and, if there are `??` files in scope, list them in the report as skipped (the user can `git add -N <file>` and re-run).

## Remove

- Comments that restate the code next to them: `// Get user by id` above `findById(id)`, `// return the result`, `// loop over users`.
- Changelog/history comments that describe the edit rather than the code: "added", "updated", "now uses", "changed to", "previously", "as requested", "fixed", "new:", "removed X". Git history already records this, and the comment goes stale the moment it's merged.
- Commented-out code (lines that would compile if uncommented). Version control keeps the old code.
- TSDoc/JSDoc on private or internal (non-exported) functions that only repeats the name and parameter types.

## Keep

- Comments explaining **why**: business rules, invariants, requirement/decision references (e.g. `D-16`), workarounds, pitfalls, non-obvious ordering. If an added one runs longer than 2 lines, shorten it to 1–2 lines while keeping its meaning.
- Tool directives: `eslint-disable*`, `oxlint-disable*`, `@ts-expect-error`, `@ts-ignore`, `prettier-ignore`, `istanbul ignore`, `c8 ignore`. Removing these changes tool behaviour, not just readability.
- TODOs in the form `TODO(<owner>): ...`. A TODO without an owner is not a reason to delete it — keep it and mention in the report that it lacks an owner.
- TSDoc on exported APIs, and on DTO properties (Swagger reads them).
- If the project's `CLAUDE.md` has a "Code comments" section, it overrides these defaults where they conflict.

When unsure whether a comment is "why" or "what", keep it and list it in the report — a missed removal costs nothing, a lost explanation does.

## Report

After editing, run `git diff --stat HEAD -- $ARGUMENTS`, then reply with:

```markdown
## clean-comments

<git diff --stat output>

| File                       | Removed | Shortened |
| -------------------------- | ------- | --------- |
| src/users/users.service.ts | 3       | 1         |

**Kept**

- `src/users/users.service.ts:27` — `// Unique constraint hit, e.g. a concurrent registration.` — explains why P2002 is caught
- `src/auth/auth.controller.ts:40` — `// eslint-disable-next-line ...` — tool directive

**Skipped:** <untracked files, or "none">
```

If the diff has no added comments, say so in one line and make no edits.
