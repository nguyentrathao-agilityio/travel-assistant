#!/usr/bin/env bash
# PreToolUse hook: block Bash commands the team never lets Claude run (exit 2 = deny, stderr goes to Claude).
command=$(jq -r '.tool_input.command // empty')
forbidden='rm -rf (/|~)|git push (.* )?(--force|-f)( |$)|prisma migrate reset|dropdb'

if echo "$command" | grep -Eq "$forbidden"; then
  echo "Blocked by team hook: '$command' is forbidden (force push, DB reset/drop, rm -rf on / or ~). Ask the user to run it manually if it is really needed." >&2
  exit 2
fi

exit 0
