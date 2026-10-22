---
name: pr-review
description: Review code changes for bugs, missing tests, security issues, and unrelated modifications. Use when reviewing a pull request or checking completed code changes.
---

# PR Review

Review the current code changes systematically.

## Steps

1. Inspect the diff before making conclusions.
2. Identify bugs and incorrect behavior.
3. Check missing, skipped, or weakened tests.
4. Look for security issues and hard-coded values.
5. Identify changes unrelated to the requested task.

## Output

For each finding, provide:

- Severity
- File path and relevant code
- Evidence explaining the issue
- Suggested fix

If no issue is found, summarize what was checked.

Do not modify files unless explicitly asked.
