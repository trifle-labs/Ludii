#!/usr/bin/env bash
# codex-fix-drift.sh — drive codex to fix constructor-arity drift, one tight task per class.
#
# Why this exists: ArgCompiler instantiates ludemes via `new TSClass(...positionalArgs)` in
# Java parameter order. Many ported TS classes drifted (bespoke/options-object/reordered ctors),
# so instantiation fails. This fixes them faithfully, one class per codex invocation.
#
# KEY codex invocation rules (learned the hard way):
#   - pass the prompt POSITIONALLY (command-substitution), NOT via stdin pipe
#   - always append `</dev/null` (codex still reads stdin; closes it so it can't hang)
#   - `--full-auto` is DEPRECATED in codex 0.134.0 → use `--sandbox workspace-write`
#   - keep stderr visible while debugging; per-class log files capture everything
#
# Safety: after each class, run tsc; if it introduced errors, `git checkout` the changed
# files (revert) and mark SKIP, so the build always stays green and the run is unattended-safe.
# Resumable: classes already non-drifted are skipped.
#
# Usage:
#   tools/parity/codex-fix-drift.sh [COUNT] [OFFSET]
#     COUNT  how many candidate classes to process this run (default 5)
#     OFFSET skip the first OFFSET candidates (default 0)
#   env: EFFORT (default high), MODEL (default gpt-5.5)

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1   # -> engine dir
ENGINE="$PWD"
COUNT="${1:-5}"
OFFSET="${2:-0}"
MODEL="${MODEL:-gpt-5.5}"
EFFORT="${EFFORT:-high}"
LOGDIR="/tmp/codex-drift-logs"
mkdir -p "$LOGDIR"
SKIP="${SKIP:-/tmp/codex-drift-skip.txt}"   # classes attempted-but-unresolved (don't re-grind)
touch "$SKIP"

baseline_errors() { npx tsc -p tsconfig.json 2>&1 | grep -c "error TS"; }

echo "== codex drift-fixer =="
# Refresh drift-report.json so candidate selection reflects ALREADY-FIXED classes
# (avoid re-grinding resolved ones). drift-check writes the report synchronously.
node tools/parity/drift-check.mjs >/dev/null 2>&1 || true
BASE=$(baseline_errors)
echo "baseline tsc errors: $BASE  (must stay <= this)"
if [ "$BASE" != "0" ]; then echo "WARNING: build not green at baseline ($BASE errors)"; fi

# Candidate list: clean single-class drifts (constructor-based, not static-construct, file exists,
# skip *1to1-entangled deep subsystems). JSON lines: jc \t file \t javaArities
CANDS=$(SKIP="$SKIP" node -e '
const fs=require("fs");
const r=require("./tools/parity/drift-report.json");
const skip=new Set(fs.readFileSync(process.env.SKIP,"utf8").split("\n").map(s=>s.trim()).filter(Boolean));
const cand=r.filter(x=>
  !skip.has(x.jc) &&
  x.javaConstructCount===0 &&            // constructor-based (not a static-construct dispatcher)
  x.tsArity!==null &&
  x.javaArities.some(a=>a>=1) &&         // has a real POSITIONAL ctor to match (skip zero-arg-only)
  Math.max(...x.javaArities)<=8 &&       // keep tractable
  !x.file.includes("/eval/") &&          // skip internal engine helpers (not .lud-instantiated)
  !/\/(util\/graph|util\/math\/Pair)\//.test(x.file)  // skip graph/topology internals
);
for(const c of cand) console.log([c.jc, c.file, c.javaArities.join(",")].join("\t"));
' | sed -n "$((OFFSET+1)),$((OFFSET+COUNT))p")

if [ -z "$CANDS" ]; then echo "no candidates in range"; exit 0; fi

n=0; fixed=0; skipped=0
while IFS=$'\t' read -r JC FILE ARITIES; do
  [ -z "$JC" ] && continue
  n=$((n+1))
  CLS="${JC##*.}"
  JAVASRC="/Users/billy/GitHub/trifle-labs/Ludii/Core/src/$(echo "$JC" | tr . /).java"
  LOG="$LOGDIR/$(echo "$JC" | tr . _).log"
  echo
  echo "[$n/$COUNT] $JC  (ts=$FILE, javaArities=[$ARITIES])"
  if [ ! -f "$JAVASRC" ]; then echo "  java source missing, skip"; skipped=$((skipped+1)); continue; fi
  if [ ! -f "$FILE" ]; then echo "  ts file missing, skip"; skipped=$((skipped+1)); continue; fi

  PROMPT="FAITHFUL 1:1 Java to TS port, single tight task. Engine dir is the current working directory ($ENGINE).

Fix the CONSTRUCTOR-ARITY DRIFT of $JC so the faithful ArgCompiler can instantiate it via new(...positionalArgs) in Java parameter order.

- Java source: $JAVASRC  (read EVERY public constructor; note exact parameter ORDER, TYPES, and @Opt/@Name/@Or/@Or2 annotations)
- TS file to fix: $FILE
- Java constructor arities present: [$ARITIES]

REQUIRED: rewrite the TS class's constructor so its parameters match Java's POSITIONAL parameters in Java's order/types. Rules:
- If Java has ONE constructor: match its exact param order/types (enums represented as their name strings; IntFunction/RegionFunction etc. as the ported function objects; @Opt/trailing params declared optional so ctor.length still permits the required count).
- If Java has MULTIPLE constructors of the SAME arity (overloaded by type, like Pair/Directions): provide ONE constructor of that arity whose params are unions of the per-overload types, dispatching on runtime type to populate the right fields. Do NOT change arity.
- If Java has multiple DIFFERENT arities: take the LARGEST arity with trailing @Opt params optional.
- Preserve the class's existing eval/logic/public API and any static factory methods so current callers keep working; port faithfully, no new logic beyond positional/type mapping.
Then UPDATE any callers in src/ that construct this class, to the new signature.

Verify: run \`npx tsc -p tsconfig.json 2>&1 | grep -c \"error TS\"\` and fix until it prints $BASE (the baseline). Do NOT git commit.
Report: the new constructor signature, files changed, and final tsc error count."

  timeout 600 codex exec --skip-git-repo-check -m "$MODEL" --config model_reasoning_effort="$EFFORT" \
      --sandbox workspace-write -C "$ENGINE" "$PROMPT" </dev/null >"$LOG" 2>&1
  CX=$?
  AFTER=$(baseline_errors)
  if [ "$CX" != "0" ]; then echo "  codex exit $CX (see $LOG)"; fi
  if [ "$AFTER" -le "$BASE" ]; then
    # Verify the constructor arity now actually matches a Java arity (the point of the fix).
    # Build stays green either way; this distinguishes a genuine fix from a green-but-wrong-arity change.
    RES=$(node -e '
      const fs=require("fs");
      const src=fs.readFileSync(process.argv[1],"utf8");
      const arities=process.argv[2].split(",").map(Number);
      const m=src.match(/\bconstructor\s*\(([\s\S]*?)\)\s*(?::|\{)/);
      if(!m){console.log("no-ctor");process.exit(0);}
      const body=m[1].trim();
      if(!body){console.log(arities.includes(0)?"RESOLVED:0":"UNRESOLVED:0");process.exit(0);}
      let depth=0,cur="",parts=[];
      for(const c of body){if("([{<".includes(c)){depth++;cur+=c;}else if(")]}>".includes(c)){depth--;cur+=c;}else if(c===","&&depth===0){parts.push(cur);cur="";}else cur+=c;}
      parts.push(cur);
      const n=parts.filter(p=>p.trim().length>0).length;
      console.log((arities.includes(n)?"RESOLVED:":"UNRESOLVED:")+n);
    ' "$FILE" "$ARITIES")
    echo "  OK: tsc errors $AFTER (<= baseline $BASE) — keeping | arity $RES (java=[$ARITIES])"
    case "$RES" in
      RESOLVED:*) fixed=$((fixed+1));;
      *) echo "  NEEDS-REVIEW: arity still off — adding to skip-list"; echo "$JC" >> "$SKIP"; fixed=$((fixed+1));;
    esac
  else
    echo "  REVERT: tsc errors $AFTER > baseline $BASE — reverting changed files"
    git -C /Users/billy/GitHub/trifle-labs/Ludii diff --name-only -- typescript/packages/engine/src | while read -r f; do
      git -C /Users/billy/GitHub/trifle-labs/Ludii checkout -- "$f" 2>/dev/null
    done
    skipped=$((skipped+1))
  fi
done <<< "$CANDS"

echo
echo "== done: $fixed kept, $skipped skipped =="
echo "drift now:"; node tools/parity/drift-check.mjs 2>&1 | head -1
