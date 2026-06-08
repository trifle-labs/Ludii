# PROJECT COMPLETION PLAN — faithful Java→TS port that PLAYS

## Goal (standing; keep going until done)
ONE faithful 1:1 Java→TS port of the Ludii engine that **plays** (behavioral parity with
Java move-for-move), not just compiles. No custom logic — re-port Java so it works like
Java. The ONLY sanctioned "special case" custom code is the reflection-emulation
(ArgCompiler + JAVA_TS_CTORS + the captured reflection metadata), because TS lacks Java
reflection. Similar narrowly-scoped emulations are allowed but must be the exception.

## The core problem (diagnosed)
Two parallel implementations existed:
1. **Bespoke path** — `compiler1to1.ts` (~9000-line dispatcher `compileNode1to1`) + 268
   `*1to1` simplified classes. PLAYS at ~60% parity. This is to be DELETED.
2. **Faithful path** — ArgCompiler (reflection-driven) + ~993 faithful classes. COMPILES
   95% but PLAYS 0%, because Java's `Game.create()` preprocessing (board ludeme eval →
   Topology graph build → `preGenerateDirection`/radials → equipment finalize) was never
   ported into `Game1to1`; the dispatcher did it procedurally and injected `ctx._radials`.

`Game1to1` is a "1:1 subset" of `game/Game.java`: faithful constructor + `start()` +
`moves()`, but NO `create()`. Java lifecycle: `new Game(...)` → `create()` → `start()` →
`moves()`.

## Plan (dependency order)
1. **[CRITICAL PATH] Port `Game.create()`** into `Game1to1.create()` (Java Game.java:2455).
   Move the board/topology setup logic out of `compileNode1to1` into `create()`. After this
   the faithful eval can run. play1to1(ArgCompiler) calls `create()` after constructing.
2. **Topology wiring**: faithful eval must read topology from the Game (set by create()),
   not from dispatcher-injected `ctx._radials`. Faithful `Topology.ts` already exists.
3. **Parity-driven eval validation**: wire play1to1 → ArgCompiler as the ONLY path; run the
   parity suite; fix faithful `eval` bugs game-by-game (the 109 stubs + divergences) via
   codex/agent waves. Resolve the eager-vs-lazy arg seam (ArgCompiler passes raw numbers
   where ludemes expect IntFunction objects).
4. **Delete the bespoke path**: remove `compiler1to1.ts`, the 268 `*1to1` classes, the
   LudemeRegistry factories, once the faithful path meets/exceeds 60% then climbs to parity.
5. **Finish**: behavioral parity ≈ Java across the corpus; one engine; bespoke gone.

## Parallelization
- Sonnet sub-agents capped until Jun 10 3pm → use **codex** (proven) for parallel waves,
  Agent/Workflow (opus) when available. Driver patterns in `tools/parity/`.
- codex invocation: positional prompt + `</dev/null` + `--sandbox workspace-write` (NOT
  stdin-pipe, NOT deprecated --full-auto).

## State (update as work proceeds)
- ArgCompiler compile-coverage: 95% (57/60). Constructor drift: 52 (robust parser).
- Parity: compiler1to1 60%; ArgCompiler 0% (no create()). Baseline to beat: 60%.
- NEXT: port Game.create() + topology wiring (step 1-2).

## Update (this session): wired + measured + the real blocker found
- play1to1 → ArgCompiler wired behind `LUDII_ARGCOMPILER` env (committed), fallback to
  compiler1to1. Build green, ArgCompiler compile-coverage holds 95%.
- **Behavioral parity baseline (strided, representative): ArgCompiler ~4% plays
  (3% OUTCOME_OK + 1% REPLAY_OK), 93% MOVE_MISMATCH; compiler1to1 ~60%.** Simple games
  (Tic-Tac-Toe) play under ArgCompiler; most don't.
- **THE pervasive behavioral bug = the eager-vs-lazy seam**: ArgCompiler's compileTerminal
  returns a RAW NUMBER for IntFunction/FloatFunction/DimFunction params; faithful ludeme
  eval calls `.eval(ctx)` on it → throws → move-gen dies. Java wraps numeric literals in
  IntConstant/FloatConstant (function objects).
- **Why it can't be flipped in isolation**: `instantiate()` tries the BESPOKE registry
  factories FIRST (they require raw numbers), then faithful JAVA_TS_CTORS (wants
  IntConstant). Wrapping ints as IntConstant regressed compile 95%→45% (registry conflict).

## Exact ordered completion path (the coordinated unit)
1. Make ArgCompiler **pure-faithful**: `instantiate()` uses ONLY JAVA_TS_CTORS (drop the
   registry.construct first-path / make it fallback only). Remove dependence on the bespoke
   LudemeRegistry factories.
2. **Faithful terminal wrapping**: compileTerminal returns IntConstant/FloatConstant/
   DimConstant (function objects) for function-typed params (not raw numbers).
3. Re-measure compile (will dip where faithful mappings are thin) + parity (should jump).
   Fix faithful JAVA_TS_CTORS gaps the registry was masking.
4. **Eval validation loop** (parallel via codex/agents): run parity → per failing game,
   read Java eval vs TS eval of the diverging ludeme → fix TS eval faithfully → re-measure.
   Climb past 60% to full parity. The 109 stub evals get ported here too.
5. **Delete the bespoke path**: compiler1to1.ts, 268 *1to1 classes, LudemeRegistry +
   factories, once faithful parity ≥ dispatcher and climbing.
6. Done = behavioral parity ≈ Java across corpus; one engine.

REALITY: steps 4-5 are the multi-week bulk (hundreds of eval methods validated game-by-game).
Steps 1-3 are the next coordinated change (the unblocker) — do them together, measure with
the fast `--filter Tic-Tac-Toe` loop, not the slow strided run.

## Update 2 (this session): faithful-first transition LANDED; topology confirmed wired
DONE this session (all committed, build green, compile-coverage 95% on the faithful path):
- ArgCompiler is now FAITHFUL-FIRST: JAVA_TS_CTORS canonical, bespoke registry fallback-only
  (instantiateFaithful()). The single-port direction is in place.
- Eager→lazy seam FIXED: numeric literals wrapped as IntConstant/FloatConstant function
  objects → eliminated WINNER_MISMATCH, TTT OUTCOME_OK 25%→50%.
- Board-generator static dispatchers (Square/Hex/Concentric) → faithful compile 45%→95%.
- CONFIRMED: Game1to1.moves()/apply() already attach ctx._radials from equipment.board.radials,
  so topology IS wired for the faithful path (TTT plays; Step.eval doesn't throw on limit-8).

REMAINING = the eval-validation bulk (multi-week, parity-driven, parallelize via codex/agents):
- Per-ludeme move-gen eval bugs: e.g. hunt games (Asalto "StepToEmpty") generate 0 moves —
  faithful Step/Slide/Hop eval direction/from-region logic yields nothing. Fix vs Java eval.
- A hanging eval (infinite loop) on some game in the strided sample — find + fix (run games
  in child processes w/ per-game timeout to keep the parity harness measurable).
- The 109 stub evals + every divergence the parity suite surfaces.
- Then delete bespoke (compiler1to1 + 268 *1to1 + registry/factories) once faithful ≥ 60%→parity.

LOOP TO RUN (repeat until parity≈Java): `LUDII_ARGCOMPILER=1 node test/parity/replay-trials.mjs
--filter <dir>` → per failing game read Java eval vs TS eval of the diverging ludeme → fix TS
eval faithfully → re-measure. Use --filter per-directory (fast) to avoid the slow/hanging full run.
