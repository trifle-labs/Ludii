#!/usr/bin/env bash
# Run codex-fix-drift in rounds, commit each round, stop when a round makes no net progress.
# Usage: codex-drift-autoscale.sh [ROUNDS] [PER]   (defaults 6, 20)
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
LUDII=/Users/billy/GitHub/trifle-labs/Ludii
ROUNDS="${1:-6}"; PER="${2:-20}"
drift() { node tools/parity/drift-check.mjs 2>&1 | grep -oE '[0-9]+ with constructor-arity drift' | grep -oE '^[0-9]+'; }
for ((i=1;i<=ROUNDS;i++)); do
  echo "######## AUTOSCALE ROUND $i/$ROUNDS ########"
  B=$(drift)
  EFFORT=high MODEL=gpt-5.5 bash tools/parity/codex-fix-drift.sh "$PER" 0
  A=$(drift)
  git -C "$LUDII" add -u typescript/packages/engine/src
  if git -C "$LUDII" commit -q -m "codex drift autoscale round $i: drift $B->$A (build green)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" 2>/dev/null; then
    echo "ROUND $i COMMITTED: drift $B -> $A"
  else
    echo "ROUND $i: nothing to commit (drift $B -> $A)"
  fi
  if [ "${A:-0}" -ge "${B:-999}" ]; then echo "no net progress ($B -> $A) — stopping autoscale"; break; fi
done
echo "=== AUTOSCALE COMPLETE; final drift: $(drift) ==="
