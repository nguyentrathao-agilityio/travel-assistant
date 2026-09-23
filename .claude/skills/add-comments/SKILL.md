---
name: add-comments
description: Use when writing or editing code comments, docstrings, or JSDoc in apps/web, apps/mobile, or apps/agent — including inline explanatory comments, multi-line rationale blocks, or comments on consts/config fields/test setup/mocks — in this repo.
---

# Add Comments

## Overview

Only the main exported function, hook, or component in a file gets a comment — **exactly one
line**, stating the non-obvious "why", never the "what". Everything else (consts, config fields,
inline logic, test setup/mocks, individual JSX lines) gets **zero** comments, no matter how
non-obvious the reasoning behind it feels. This supersedes `review.md`'s "Key functions/hooks/
components have JSDoc comments" checklist item — that means one line, not a JSDoc block.

If the one-line comment would run past ~100 chars, cut content — don't wrap to a second line.

**Stricter than general practice on purpose:** industry guidance (Google style guides, Clean
Code) says comment wherever the "why" is genuinely non-obvious, not only on a file's main export.
This project's rule is a deliberate tightening from repeated, explicit user feedback — treat it as
this codebase's house rule, not a universal best practice to cite elsewhere.

## Example

```typescript
// ❌ Multi-line JSDoc, or a comment on a plain const/config field
/**
 * The CopilotKit client can silently drop the cancel request if the server's real run id
 * hasn't arrived yet when Stop is pressed — the client detaches its own stream regardless,
 * so generation resumes and the button reappears. Retry once so a single press reliably
 * stops the run instead of requiring a second manual tap.
 */
const stop = useCallback(() => { ... });

export const STOP_GENERATION_RETRY_DELAY_MS = 1_200; // no comment needed here at all

// ✅ One line on the main function, nothing on the const
export const STOP_GENERATION_RETRY_DELAY_MS = 1_200;

// Retries once — the client can silently drop the cancel request otherwise.
const stop = useCallback(() => { ... });
```

## Rationalizations that don't hold up here

Every one of these was tried in a real session and rejected — don't repeat them.

| Rationalization                                                                     | Reality                                                                                   |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| "This bug's root cause isn't obvious from the code"                                 | Explain it in the chat reply or commit message, not a code comment.                       |
| "It's only 3 lines, that's still short"                                             | 3 lines on one const/line is too long. Cap is 1 line, always.                             |
| "This mock/test setup has a real, non-obvious infra constraint"                     | Still zero comments on test setup/mock blocks.                                            |
| "This index-as-key is safe because the list is static, worth a note"                | No — inline justifications on individual lines are never added.                           |
| "I already collapsed it to 1 line once, so repeating the pattern elsewhere is fine" | Re-check every new file — the default is still zero comments unless it's the main export. |

## Red flags — stop and delete the comment

- You're about to write `/** ... */` anywhere other than directly above the file's main export.
- The comment is on a `const`, a config object field, a single statement, or inside a `jest.mock(...)` setup.
- You're explaining a bug's root cause in the code instead of the chat reply or commit message.
- The draft comment is already past line 2 and you're deciding whether to keep going.

**All of these mean: delete the comment, don't shorten it and keep it.**

## Common mistakes

- Adding a comment to a constant, config object field, or single statement instead of only the
  file's main export.
- Explaining a bug fix's rationale in a code comment instead of the chat response/commit message.
- Writing a comment "because the reasoning is genuinely non-obvious" — non-obvious reasoning goes
  in the conversation, not the diff, unless it sits directly above the main export and fits one line.
