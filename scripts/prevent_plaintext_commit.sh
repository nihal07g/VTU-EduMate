#!/usr/bin/env bash
# Purpose: Prevent accidental commits of plaintext data or tarballs
set -euo pipefail

BLOCKED_PATTERNS=(
  "^data/"
  "data.tar.gz$"
)

staged=$(git diff --cached --name-only || true)
if [ -z "$staged" ]; then
  exit 0
fi

fail=0
for f in $staged; do
  for p in "${BLOCKED_PATTERNS[@]}"; do
    if [[ "$f" =~ $p ]]; then
      echo "❌ Blocked from commit: $f"
      fail=1
    fi
  done
done

if [ $fail -ne 0 ]; then
  cat <<'MSG'
🚫 Plaintext data artifacts detected in staged changes.
Only commit the encrypted artifact: data.sec.tar.gz.gpg

To proceed:
  git reset HEAD .
  # Keep your changes, but do NOT stage ./data or data.tar.gz
MSG
  exit 1
fi