# Faithful Compiler — status & handoff (replacing compiler1to1.ts)

## Goal
Replace the bespoke `src/compiler1to1.ts` dispatcher with a faithful port of Java's
real `.lud` compilation path, so `play1to1` uses it and `compiler1to1.ts` is deleted.

## Done (committed, `npx tsc -p tsconfig.json` green)
- **EBNF grammar loader** `src/ludii/Language/src/grammar/ebnf-grammar-loader.ts`:
  `parseEbnfGrammar(text)` loads Java's emitted grammar (`tools/parity/java-grammar-current.txt`)
  → 376 symbols / 490 keyword clauses. (Fixed: operator-symbol parsing `<>=>`,`<<=>` etc.)
- **Compiler core** `src/ludii/compiler/Compiler.ts` + `LudemeRegistry.ts` + `ArgBundle.ts`:
  grammar-driven; Tic-Tac-Toe compiles and matches the dispatcher (`tools/proof/faithful-ttt-proof.mjs`).
  Verified all common move forms (Add/from-to/Step/Slide/Hop/siteType) compile — **matcher core is sound.**
- **490 keyword factories** `src/ludii/compiler/factories/batch0..9/` + `createFullRegistry.ts`.
- **Real-game compile coverage: 36%** (broad 200-game sample; `tools/proof/faithful-coverage.mjs`).

## Where it's stuck
Factory-completion waves are tapped (~32-36%). Remaining failures are a long tail of
diverse, per-case matcher/grammar-arg + niche-ludeme issues (e.g. chess check/castling,
`(square N pyramidal:True)`, `(last ...)` region form, role/int arg coercions).

## The meta-blocker (fix this FIRST to make the grind efficient)
`Compiler.ts`'s `deepestMiss` diagnostic still MIS-RANKS: it surfaces deep benign probes
instead of the true required-arg blocker (e.g. reports `<int> 'player'` for chess games
that contain no `(player …)`). Until the diagnostic reliably names the real culprit per
game, per-case grinding (by me or Codex) is inefficient.
RECOMMENDED FIX: record `deepestMiss` ONLY at REQUIRED-arg failure points in `matchArgs`
(thread an `isRequired`/position flag into the leaf throw), and prefer real factory-thrown
(non-`CompilerMatchError`) errors over clause-match misses. Then the coverage proof's
top reasons become actionable.

## The loop that works
`node tools/proof/faithful-coverage.mjs` → take the top REAL blocker → fix the factory
(map ArgBundle→ported class ctor) or the matcher/grammar-arg handling → `tsc` green →
re-measure → commit. Parallel Codex per-batch factory waves lift coverage in bulk
(0→32%); matcher/grammar fixes are manual (Opus) one-offs.

## Realistic remaining effort
Multi-week: complete the diverse factory arg-variants + per-ludeme matcher cases until
compile coverage ≈ dispatcher, THEN diff move-generation game-by-game vs the dispatcher,
THEN switch `play1to1` to `Compiler` and delete `compiler1to1.ts`. The dispatcher
(`compiler1to1` / `play1to1`, ~18% behavioural parity) remains the working engine until then.

## Update 2026-06-07: plateau confirmed at ~36%, diagnostics now clean
Pulled every in-session lever: factory waves (0→32%), grammar operator-parse fix,
**faithful ArgClass-style TYPE-based arg matching** (global keyword + `instanceof Base*`
type-fit, replacing lossy EBNF-name matching), and **clean deepest-miss diagnostics**
(discard misses from successfully-compiled subtrees → pinpoints the true blocker).
Coverage held at 60-sample 32% / 200-sample 36%. Further factory waves are flat.

Remaining is a deep, CHAINED, per-case long tail: each failing game terminates in a
specific move/region ludeme arg-variant (e.g. embedded piece-movement `<moves>` defines
like LeapCapture/PawnMove; `(if …)` end/moves variants; `(move …)`/`(forEach …)`/`(do …)`
arg shapes). Fixing one reveals the next; coverage only rises when a whole game's chain
clears. This is multi-week volume best run as a SCHEDULED cadence (parallel Codex
factory-completion + queued matcher cases against faithful-coverage.mjs), NOT a single
in-session grind (which is now exhausted — flat per wave).

Current true top blockers (200-game sample):
  6  no grammar candidate: keyword 'then' is not a <moves>
  6  <moves> 'move': args matched none of 18 clause(s)
  5  <phase.phase> 'phase': args matched none of 1 clause(s)
  5  <moves> 'forEach': args matched none of 11 clause(s)
  5  <graph> 'add': args matched none of 1 clause(s)
  4  no grammar candidate: keyword 'end' is not a <play>
  4  <moves> 'do': args matched none of 1 clause(s)
  3  no grammar candidate: keyword 'start' is not a <play>
  3  <item> 'tile': args matched none of 1 clause(s)
  3  no grammar candidate: keyword 'directions' is not a <moves.to>
  3  no grammar candidate: keyword '>' is not a <boolean>
  2  factory batch6: expected int-array function for forEach Value values
  2  Compiler: headless list cannot match <game>
  1  <moves.from> 'from': args matched none of 1 clause(s)
