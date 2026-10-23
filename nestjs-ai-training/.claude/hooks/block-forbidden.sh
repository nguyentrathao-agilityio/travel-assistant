#!/usr/bin/env bash
# PreToolUse hook: block Bash commands the team never lets Claude run (exit 2 = deny, stderr goes to Claude).
# A safety net matched on the command text, not a security boundary. Fails closed when jq is missing.
if ! command -v jq >/dev/null; then
  echo "Blocked by team hook: jq is required to check Bash commands. Install jq (brew install jq)." >&2
  exit 2
fi

command=$(jq -r '.tool_input.command // empty')

start='(^|[;&|(][[:space:]]*|[[:space:]])'
end='([[:space:];&|)]|$)'
rm_root="${start}rm([[:space:]]+-[^[:space:]]+)*[[:space:]]+(/|/\*|~|~/|~/\*|\\\$HOME|\\\$HOME/|\\\$HOME/\*)${end}"
force_push="${start}git([[:space:]]+-C[[:space:]]+[^[:space:]]+)*[[:space:]]+push([[:space:]]+[^[:space:]]+)*[[:space:]]+(--force|--force-with-lease(=[^[:space:]]*)?|-f|\+[^[:space:]]+)${end}"
db_reset="${start}(prisma[[:space:]]+migrate[[:space:]]+reset|dropdb)${end}"

for pattern in "$rm_root" "$force_push" "$db_reset"; do
  if [[ "$command" =~ $pattern ]]; then
    echo "Blocked by team hook: '$command' is forbidden (force push, DB reset/drop, rm on / or ~). Ask the user to run it manually if it is really needed." >&2
    exit 2
  fi
done

exit 0
