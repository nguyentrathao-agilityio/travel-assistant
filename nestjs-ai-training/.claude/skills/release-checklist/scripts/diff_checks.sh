#!/usr/bin/env bash
# Scans what the current branch changes relative to a base ref and prints
# one finding per line: FAIL|WARN|INFO <check>: <detail>.
# Usage: diff_checks.sh <base-ref>   (run from anywhere inside the repo)

set -u

base="${1:-origin/feat/ai-tool-training}"
root="$(git rev-parse --show-toplevel)" || exit 2
cd "$root" || exit 2

if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "FAIL base: unknown ref '$base'"
  exit 2
fi

app="nestjs-ai-training"
range="$base...HEAD"
found=0

report() {
  echo "$1 $2: $3"
  found=1
}

# Added lines (with file:line) under the given paths, from the branch diff
# plus uncommitted changes.
added_lines() {
  { git diff -U0 "$range" -- "$@"; git diff -U0 HEAD -- "$@"; } | awk '
    /^\+\+\+ b\// { file = substr($0, 7); next }
    /^@@/ { split($3, a, ","); line = substr(a[1], 2) + 0; next }
    /^\+/ && !/^\+\+\+/ { print file ":" line ": " substr($0, 2); line++ }
  '
}

changed_files() {
  { git diff --name-only "$range"; git diff --name-only HEAD; } | sort -u
}

files="$(changed_files)"

# Focused or skipped tests silently shrink the suite.
added_lines "$app/src" "$app/test" \
  | grep -E '\b(it|describe|test)\.(only|skip)\(|\b(xit|xdescribe|fit|fdescribe|xtest)\(' \
  | while read -r l; do report FAIL focused-or-skipped-test "$l"; done

# Deleted test files.
git diff --name-only --diff-filter=D "$range" -- "$app/src" "$app/test" \
  | grep -E '\.(spec|e2e-spec)\.ts$' \
  | while read -r f; do report FAIL deleted-test "$f"; done

# Debug output left in source.
added_lines "$app/src" \
  | grep -E '\bconsole\.(log|debug)\(|\bdebugger\b' \
  | while read -r l; do report WARN debug-output "$l"; done

# Leftover TODO/FIXME markers.
added_lines "$app/src" "$app/test" \
  | grep -E '\b(TODO|FIXME|XXX)\b' \
  | while read -r l; do report WARN todo-marker "$l"; done

# Requirement IDs belong in docs, not in code comments or test names.
added_lines "$app/src" "$app/test" \
  | grep -E '\b((FR|DES|AC)-[A-Z]+-[0-9]+|NFR-[0-9]+|(D|Q|A)-[0-9]{2,3})\b' \
  | while read -r l; do report WARN requirement-id-in-code "$l"; done

# Secrets and env files.
echo "$files" | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' \
  | while read -r f; do report FAIL env-file-committed "$f"; done

added_lines "$app/src" "$app/prisma" \
  | grep -iE "(secret|password|api[_-]?key|token)['\"]?[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]" \
  | while read -r l; do report WARN possible-hardcoded-secret "$l"; done

# Schema changes need a migration in the same branch.
if echo "$files" | grep -q "^$app/prisma/schema.prisma$"; then
  if echo "$files" | grep -q "^$app/prisma/migrations/.*/migration.sql$"; then
    report INFO schema-change "schema.prisma and a migration changed (needs approval)"
  else
    report FAIL schema-without-migration "schema.prisma changed but no new prisma/migrations/*/migration.sql"
  fi
fi

# Dependency changes need approval.
if git diff "$range" -- "$app/package.json" | grep -qE '^[+-][[:space:]]+"[@a-z0-9./-]+":[[:space:]]*"[~^0-9]'; then
  report INFO dependency-change "package.json dependencies changed (needs approval)"
fi

# Build, lint, test or TypeScript config changes need approval.
echo "$files" \
  | grep -E "^$app/(tsconfig[^/]*\.json|jest[^/]*\.js|nest-cli\.json|\.oxlintrc[^/]*|prisma\.config\.ts)$" \
  | while read -r f; do report INFO config-change "$f (needs approval)"; done

# New environment variables must be documented in .env.example.
added_lines "$app/src" "$app/test" "$app/prisma" \
  | grep -oE 'process\.env\.[A-Z0-9_]+|process\.env\[.[A-Z0-9_]+.\]' \
  | grep -oE '[A-Z][A-Z0-9_]+' | sort -u \
  | while read -r v; do
      grep -qE "^#?[[:space:]]*$v=" "$app/.env.example" 2>/dev/null \
        || report WARN env-var-undocumented "$v not in .env.example"
    done

# New controllers or routes: Swagger and e2e need a manual look.
echo "$files" | grep -E "^$app/src/.*\.controller\.ts$" \
  | while read -r f; do report INFO controller-changed "$f (check Swagger decorators and e2e coverage)"; done

if [ "$found" -eq 0 ]; then
  echo "INFO diff-checks: no findings"
fi
