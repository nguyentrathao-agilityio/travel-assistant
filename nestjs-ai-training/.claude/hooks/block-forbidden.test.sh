#!/usr/bin/env bash
# Checks block-forbidden.sh against commands it must block (exit 2) and must allow (exit 0).
hook="$(dirname "$0")/block-forbidden.sh"
failures=0

check() {
  local expected=$1 command=$2 actual
  jq -n --arg c "$command" '{tool_input: {command: $c}}' | "$hook" 2>/dev/null
  actual=$?

  if [[ $actual -ne $expected ]]; then
    echo "FAIL (expected $expected, got $actual): $command"
    failures=$((failures + 1))
  fi
}

check 2 'rm -rf /'
check 2 'rm -rf ~'
check 2 'rm -fr /'
check 2 'rm -r -f /'
check 2 'rm --recursive --force /'
check 2 'rm -rf -- /'
check 2 'rm -rf /*'
check 2 'rm -rf $HOME'
check 2 'cd x && rm -rf ~/'
check 2 'git push --force'
check 2 'git push -f origin dev'
check 2 'git push origin dev --force'
check 2 'git push --force-with-lease'
check 2 'git push origin +main'
check 2 'git -C repo push --force'
check 2 'pnpm exec prisma migrate reset'
check 2 'npx prisma migrate reset --force'
check 2 'dropdb nestjs_ai_training'
check 2 'pnpm test; dropdb foo'

check 0 'rm -rf /tmp/build'
check 0 'rm -rf ~/.cache/foo'
check 0 'rm -rf dist'
check 0 'git push origin feat/x'
check 0 'git push -u github chore/x'
check 0 'git status -f'
check 0 'git commit -m "document dropdb"'
check 0 'grep -r "prisma migrate reset" docs/'
check 0 'pnpm db:migrate'
check 0 'pnpm test'

if [[ $failures -eq 0 ]]; then
  echo "All block-forbidden checks passed"
fi

exit $((failures > 0))
