#!/usr/bin/env bash
# PostToolUse hook: format the TypeScript files Claude edits or writes, same scope as `pnpm format`.
if ! command -v jq >/dev/null; then
  echo "format-on-edit hook skipped: jq is not installed (brew install jq)." >&2
  exit 0
fi

project_dir=$(cd "$(dirname "$0")/../.." && pwd -P)
file=$(jq -r '.tool_input.file_path // empty')
file=$(realpath "$file" 2>/dev/null) || exit 0

case "$file" in
  "$project_dir"/src/*.ts | "$project_dir"/test/*.ts) ;;
  *) exit 0 ;;
esac

cd "$project_dir" && pnpm exec prettier --write --log-level warn "$file" >&2
exit 0
