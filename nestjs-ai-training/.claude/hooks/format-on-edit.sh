#!/usr/bin/env bash
# PostToolUse hook: format every file Claude edits or writes with the project's Prettier config.
project_dir=$(cd "$(dirname "$0")/../.." && pwd -P)
file=$(jq -r '.tool_input.file_path // empty')
file=$(realpath "$file" 2>/dev/null) || exit 0

case "$file" in
  "$project_dir"/node_modules/* | "$project_dir"/dist/*) exit 0 ;;
  "$project_dir"/*.ts | "$project_dir"/*.js | "$project_dir"/*.json | "$project_dir"/*.md) ;;
  *) exit 0 ;;
esac

cd "$project_dir" && pnpm exec prettier --write --log-level warn "$file" >&2
exit 0
