# PROJECT COMPLETION PLAN — faithful Java→TS port that PLAYS

## Goal (standing; keep going until done)
ONE faithful 1:1 Java→TS port of the Ludii engine that **plays** (behavioral parity with
Java move-for-move), not just compiles. No custom logic — re-port Java so it works like
Java. The ONLY sanctioned "special case" custom code is the reflection-emulation
(ArgCompiler + JAVA_TS_CTORS + the captured reflection metadata), because TS lacks Java
reflection. Similar narrowly-scoped emulations are allowed but must be the exception.

## DEFINITION OF COMPLETE (all four required)
1. **Behavioral parity**: faithful path ≥ bespoke baseline across the corpus, verified against
   recorded Java trials (move-for-move + winner via the parity harness).
2. **Bespoke deleted**: compiler1to1.ts, the ~270 *1to1 classes, LudemeRegistry + batch factories,
   Board1to1/Equipment1to1 — gone. One engine.
3. **FIDELITY-HARDENING PASS** (user-mandated; upstream-maintainability is part of done):
   the port must be structurally 1:1, not just behaviorally, so an upstream Java change maps
   to an obvious TS edit at every layer. Concretely (debt measured 2026-06-09):
   a. **De-contaminate**: 0 faithful files importing from bespoke `*1to1` modules (currently 69 —
      e.g. Step.ts imports resolveRelativeDir from Step1to1.ts; move shared helpers into the
      faithful tree at their Java-mirrored locations).
   b. **Substrate migration**: faithful eval bodies read the JAVA API shapes — Context.to()/from()/
      between(), topology().trajectories()/radials, ContainerState — not the TS-port substrate
      (ctx._radials/_evalTo/_trajectories; currently 63 faithful files on the TS substrate vs 34 on
      Java-named API). The _eval*/CellFlatRadials plumbing may survive as the INTERNAL implementation
      behind the Java-named accessors, but ludeme eval code must read like the Java source.
   c. **One State**: converge on the faithful other/state/State.ts surface (Java's State/ContainerState
      family) as the API ludemes see; the 50KB TS state.ts becomes the implementation behind it (or is
      folded in at Java-mirrored paths).
   d. **Dispatch minimization**: hand-curated ArgCompiler routing (FAITHFUL_MOVE_VARIANTS + 7
      preferred-token hooks) shrinks to the sanctioned reflection-emulation; each surviving entry
      documented with WHY generic resolution fails for it (or the generic resolver fixed).
   e. **Mirror completeness**: every ported Java class lives at its mirrored path with @java tags
      (close the gaps, e.g. 31/35 effect/ classes mirrored); *Faithful ctor adapters carry the Java
      ctor signature verbatim in declaration order.
4. **Verification stays green**: the probe suite + parity harness pass throughout; bespoke-removal and
   hardening steps are each verified the same way as parity waves (no behavioral regression).

The upstream-update playbook this buys: .lud changes = data-only; new/changed ludeme = regenerate
reflection+grammar capture + edit the one mirrored file; core-runtime change = edit the mirrored
runtime class whose internals now read like Java.

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

## Update 3: eval-validation loop driven — the gaps are LAYERED (Context/State/eval)
Drove the loop starting with Step. Fixed two real faithful bugs (committed, green):
1. **Step.eval** used `cellRadials[dirName]` on a `{axes:[]}` shape (always undefined → 0 moves);
   now uses `radialsForDirection()` (expands Adjacent→axes), matching Step1to1. (eval+evalRegion)
2. **State.owned** added — on-demand piece-position index (scan cells/whats → Location[][] by
   component, mapCompIndex identity), the faithful Owned index ForEachPiece needs.

But move-gen for `forEach Piece` games (most board games) is blocked across MULTIPLE LAYERS,
each needing a faithful port/wire — this is why behavioral parity is the multi-week bulk:
- **Context API gap (NEXT holistic blocker)**: faithful evals call Java Context methods that the
  lean TS `src/context.ts` Context doesn't expose: `components()`, `containerState(cont)`,
  `topology()`, `board()`, `containers()`. ForEachPiece needs `components()` for moverCompIndices
  → undefined → 0 moves regardless of owned. Port these onto Context (faithful to Java Context).
- **State layer**: owned added; other Java State accessors may be needed per ludeme.
- **Per-ludeme eval**: Step fixed; Hop, Slide, Sow, custodial, etc. each need validation vs Java.
- **A hanging eval** (infinite loop) on some game — find via child-process-per-game timeout.

NEXT CONCRETE STEP: wire the Context API (components/containerState/topology/board/containers)
onto the faithful Context — this unblocks ForEachPiece → most board games start generating moves;
then re-run parity to see the jump + the next per-ludeme divergences. This is porting Java's
Context, not new code.

CURRENT: faithful-first + eager-fix + board-gens + Step + owned committed; compile 95%; behavioral
parity still low (Context-API gap blocks forEach-Piece move-gen). Drift grind 52→37 (running).

## Update 4: Context API ported (committed, green) — forEach-Piece now iterates
Ported Java's Context accessors onto the faithful Context: components() (adapts
equipment.pieces: passes through the real component + a generate() adapter wrapping the
piece's MovesFunction generator), containerState() (per-site accessors delegating to State
arrays: what/who/state/rotation/value/sizeStack), board()/topology()/containers() (from
equipment.board). tsc green; compile-coverage 95% held; Flip/Roll compile again.

RESULT: ForEachPiece now iterates pieces + generates moves (Breakthrough tsMoveCount 0→1,
was 0). The Context-layer blocker is cleared.

NEXT LAYER — per-piece move-gen completeness: move count is too LOW (1 vs the many a pawn
row should yield). Candidates: (a) start placement not setting cells/whats for all pieces
(owned then finds too few), (b) ForEachPiece iterating one piece not all, (c) Step
generating too few directions per piece. Diagnose on Breakthrough (simple forEach-Piece+Step):
inspect owned.positions(1) count + per-piece Step output vs Java. Then Hop, the hang, etc.

STACK OF FIXES THIS CAMPAIGN (all committed, green): faithful-first instantiate; eager→lazy
IntConstant wrapping; board-gen dispatchers (compile 95%); Step radials; State.owned; Context API.
Behavioral parity climbing from ~4%; the per-ludeme/per-game move-gen grind continues.

## Update 5 (THIS session): move-gen completeness drilled to the REAL blocker = create()
Two committed, verified fixes + a complete evidence-backed root-cause of why faithful games
don't play. The "tsMoveCount=1" was NOT a Step/forEach bug — it was a degenerate board.

FIX 1 (committed): **faithful Step.eval relative directions + ray-only single-dir.**
Step.eval walked BOTH ray and opposite of every axis (so "N" wrongly stepped S too), and
relative dirs {FR FL Forward} hit radialsForDirection's Adjacent fallback (never converted
to absolute via facing). Ported Step1to1.resolveRelativeDir + isSingleDir into a shared
stepTargets() helper. Matches the dispatcher, which yields the correct 22 first moves for
Breakthrough (square 8). Now Step.ts is move-for-move correct — but unverifiable end-to-end
until create() lands (see below).

FIX 2 (committed): **faithful Board.createTopology builds real topology from the graph fn.**
Java's Game.create() drives board.createTopology(); the TS faithful Board had a NO-OP
createTopology (deferred to bespoke Board1to1) → numSites=0. Ported it: graphFn.eval(siteType)
→ Graph → Trajectories + buildGraphRadials → width/height/numSites/containerSpan (the proven
makeBoard path; generator eval takes SiteType as FIRST arg; Vertex fallback). Verified in
isolation: (board (square 8)) → numSites 64, 8x8, 64 radials. tsc+build green.

THE EVIDENCE (probes, LUDII_ARGCOMPILER=1 vs bespoke, on Breakthrough square-8):
- bespoke path: numSites=64, 32 pieces placed, _playerDirs={1:N,2:S}, **22 moves** (correct).
- faithful path: board ctor=**Board1to1(1,1)**, numSites=1, 0 placed, playerDirs undefined,
  startRules=0 → moves()=[Pass]. So forEach-Piece finds nothing on a 1-cell board.
- (square 8) ALONE → RectangleOnSquare, eval('Cell') → Graph 64 faces / 81 verts (works!).
- (board (square 8)) ALONE → faithful Board, after createTopology → 64 (FIX 2 works!).
- (equipment {(board(square 8)) (piece "Pawn" Each) (regions ...)}) → registry
  **Equipment1to1 + Board1to1(1,1)**: the faithful Equipment (C693) instantiation returns
  null → instantiate() falls back to the bespoke registry, whose board degenerates to 1x1.

ROOT CAUSE (the create() gap, precisely): the faithful path maps game.Game→Game1to1, but
Game1to1's constructor expects a FULLY-BUILT equipment (board topology + per-player pieces +
playerDirs + startRules) — i.e. the product of Java's Game.create(). The dispatcher
(compileNode1to1) builds all of that procedurally before constructing Game1to1; the
ArgCompiler never runs create(). Each faithful structural ludeme is only partly wired:
  1. Board.createTopology — FIXED (Fix 2), but only reached when the faithful Board is used.
  2. **Equipment (C693) instantiation FAILS → registry Equipment1to1 + Board1to1(1,1).**
     Equipment's ctor stores items; createItems(game) (per-player piece expansion, container
     init, region build) only runs at Game.create() time — never invoked on the faithful path.
  3. Pieces: "Pawn Each" never expands to Pawn1/Pawn2 components with indices (createItems job).
  4. players → _playerDirs: parsed by the dispatcher; faithful path leaves it undefined.
  5. start (place ...) → startRules: built by the dispatcher; faithful path has 0.
  6. Game1to1 caches numSites/width/height at construction (readonly) from equipment.board —
     so equipment MUST be fully built BEFORE Game1to1 is constructed (no post-hoc create()).
  PLUS a typing reconciliation: the whole pipeline (Equipment1to1.board, Game1to1, evals) is
  typed around **Board1to1**'s public surface; the faithful Board extends Container (protected
  numSites). They must duck-type/converge for the faithful Board to flow through.

NEXT (ordered, the create() port — the multi-week bulk; parallelize via codex):
  a. Make faithful **Equipment** instantiate + run createItems at compile time: expand
     per-player pieces (Each→Pn) with component indices, init containers (call
     board.createTopology), build regions. Reconcile Board1to1 ↔ faithful Board surface so the
     real board flows into Equipment/Game1to1.
  b. Port **players → _playerDirs** (compass facing) and **start (place/place-stack) →
     startRules** into the faithful game assembly, supplied to Game1to1 (portOptions or ctor).
  c. Invoke a faithful **create()** pass so the built equipment/topology reach Game1to1 BEFORE
     it caches numSites. Option: ArgCompiler builds equipment fully (create-eager) then Game1to1.
  d. Re-probe Breakthrough: expect numSites 64, 32 placed, 22 moves — parity with bespoke +
     Java. Then climb the per-ludeme eval grind (Hop/Slide/Sow/custodial…) past 60% to parity.
  e. Delete bespoke (compiler1to1 + 268 *1to1 + registry/factories) once faithful ≥ parity.

KEY INSIGHT: the dispatcher's create()-equivalent (compileNode1to1 game-assembly +
compileEquipment1to1 + compileBoard + buildBoardGraph + playerDirs + startRules) is FAITHFUL
INFRASTRUCTURE (@java-tagged, real graph machinery), distinct from the simplified *1to1 EVAL
classes that are the "second port" to delete. Completing create() may reuse/move that
infrastructure (user authorized "move/modify work that's needed") rather than re-derive it.

FINER DIAGNOSIS of step (a) — exactly why faithful Equipment returns null (probed):
- Individual items DO compile faithfully: (board (square 8))→Board, (piece "Pawn" Each)→Piece,
  (regions P1 (sites Top))→Regions.
- `new Equipment([board,piece,regions])` throws **"item.type is not a function"**, because:
  • faithful **Piece does NOT extend Item** (`class Piece {`) so it has no .type() — Container
    (Board) and Regions both `extends Item` and do. FIX: make Piece extend the Component/Item
    chain (Java: Component extends Item) so it carries name/index/owner/type/create.
  • Board's _type is never set to "Board" (Item._type defaults null); Equipment's ctor loops
    `item.type()==="Board"`. FIX: set item types (Java sets them in create()/by class), or
    change the board check to a structural/instanceof test.
- After the ctor, **createItems(game)** is what does per-player piece expansion + container init
  (calls board.createTopology) + region build — and it needs a Game. That's the chicken-and-egg:
  Equipment.createItems(game) needs the Game; Game1to1's ctor needs the built equipment. Java
  resolves it because Game holds the ludeme tree and create() populates in place; the TS
  Game1to1 takes pre-built equipment. RESOLUTION OPTIONS: (i) build equipment eagerly in the
  ArgCompiler game-compile (call createItems with a minimal game stub exposing numPlayers +
  board) BEFORE constructing Game1to1; or (ii) reuse the dispatcher's compileEquipment1to1 for
  the faithful path's equipment while ArgCompiler builds the rules-eval tree.
This is a coordinated multi-file change (Piece→Item, Equipment.createItems wiring, players/
start→portOptions, create() ordering, Board1to1↔Board surface) — the multi-week bulk. Parallelize
the mechanical class-porting via codex; keep the 95% compile baseline green at each step.

## Update 6 (THIS session): full faithful Equipment port LANDED through createItems;
## remaining blocker = the faithful Topology subsystem (user chose the purest 1:1 path)
User decision: "Full faithful Equipment port" (purest 1:1, accept regression risk). Executed
in safe, committed, green steps — all DORMANT until the create() pass is wired (bespoke uses
Equipment1to1), so zero regression to the 60%/95% baselines (verified: 0 compile/start fails).

DONE + COMMITTED this session:
- Faithful **Piece extends Component** (PieceFaithful.ts), Java ctor (name, role[Each], dirn,
  flips, generator, maxState/Count/Value); JAVA_TS_CTORS game.equipment.component.Piece → it.
  Bespoke equipment Piece (component/Piece.ts) untouched.
- **RoleType**: added missing Java roles (Each, Mover, Next, Prev, NonMover, Friend, Ally,
  TeamMover, P9–P16); Each.owner()=NOBODY(0). (Each was absent → pieces couldn't carry role.)
- **Equipment** ctor: `item instanceof Board` (Java Equipment.java:114), not the never-matching
  type()==="Board". Full (equipment {...}) now compiles to the FAITHFUL Equipment.
- **Component.clone()** (prototype copy) + getClass() stand-in; Die/Tile clone() → override.
- **Equipment.createItems** _makeEmptyPiece/_makePiece now build real `new Piece(...)`.
  VERIFIED: createItems(gameStub) expands (piece "Pawn" Each) → real components
  [Disc#0(empty), Pawn/P1, Pawn/P2] (Java size()-1 index), Board container + 2 regions.

THE REMAINING BLOCKER (the deepest, largest piece): createItems →
**initContainerAndParameters** drives the full faithful **Topology** subsystem, but
other/topology/Topology.ts is a PARTIAL STUB. Present: getGraphElements, cells, numEdges,
optimiseMemory. MISSING (~12): computeRelation, computeSupportedDirection,
convertPropertiesToList, computeRows, computeColumns, crossReferencePhases, computeLayers,
computeCoordinates, preGenerateDistanceTables, preGenerateDistanceToEachElementToEachOther,
computeDoesCross, pregenerateFeaturesData. These are Java Topology.java + GraphElement
relation/distance machinery — thousands of lines. Board.createTopology must ALSO build a real
faithful Topology object (cells/edges/vertices from the Graph) and Board.topology() return it
(currently Board builds only Board1to1-style radials/Trajectories, which the eval engine reads
via ctx._radials — that part is done & verified at 64 sites).

NEXT (ordered):
  a. Port the ~12 missing faithful Topology methods (Java other/topology/Topology.java) +
     a Graph→Topology builder so Board.createTopology populates cells/edges/vertices/relations.
     Parallelize via codex (methods interdepend — port + verify in dependency order).
  b. Board.topology() returns the faithful Topology; keep the Board1to1-style radials for the
     eval engine (ctx._radials) until evals migrate to reading topology().trajectories().
  c. Faithful create() pass (Task #13): players→_playerDirs, start→startRules, run
     Equipment.createItems with a game stub (numPlayers+board) BEFORE constructing Game1to1.
  d. Re-probe Breakthrough faithful: expect 64 sites, 32 placed, 22 moves — parity with bespoke.
  e. Per-ludeme eval grind → delete bespoke once faithful ≥ parity.

## Update 7 (THIS session): faithful path PLAYS end-to-end; move-gen blocker = move-dispatch
HUGE milestone: the faithful (ArgCompiler) path now COMPILES Breakthrough to the faithful
Equipment AND PLAYS it end-to-end (probe-play.mjs: equip=Equipment, sites=64, placed=32).
The entire create() chain works: faithful Topology subsystem (codex-ported, verified — cells/
edges/vertices/relations/rows/cols/coords/distances), per-player piece expansion, start
placement, playerDirs. Committed in steps; bespoke parity NOT regressed (Breakthrough bespoke
100% OUTCOME_OK; shared Rules1to1/OrBool changes additive).

NEW BLOCKER (move-gen CORRECTNESS) — precisely root-caused: faithful Breakthrough over-generates
(110 moves vs Java's 22). NOT a Step/Directions/State bug. The cause: the faithful `move`-keyword
DISPATCH is unwired. `(move Step (directions {FR FL}) (to ...apply remove...))` resolves via the
bespoke REGISTRY alias `registry.registerLudeme("move:step", makeStep)` (batch5) — instantiateFaithful
is NEVER called for game.rules.play.moves.nonDecision.effect.Step. The registry `makeStep` is a
SIMPLIFIED adapter: it takes only `firstDirectionName(b) ?? "Adjacent"` (one name, and it doesn't
recognise the `(directions {FR FL})` list → defaults to Adjacent = all 8 dirs) and hardcodes
`sideEffect: null` (drops `(apply (remove (to)))`). So Step runs my correct Step.eval/stepTargets
(which DOES resolve FR/FL→NE/NW via playerDirs — verified) but receives dirnChoice=Adjacent, hence
all-8 over-generation. The faithful StepFaithful (correct ctor: from,directions,to,stack,then →
directionsFunction) is bypassed.

THIS AFFECTS ALL MOVE LUDEMES (Step/Slide/Hop/Add/Remove/Shoot/…): each `(move X ...)` routes to a
simplified registry make<X> adapter instead of the faithful class. Fixing the faithful move-keyword
dispatch is THE next structural unlock for move-gen correctness across the corpus.

## Update 8 (THIS session): MILESTONE — the faithful engine PLAYS a game move-for-move
The faithful single engine now plays Breakthrough CORRECTLY end-to-end: probe-play.mjs →
"22 moves (all forward, none onto own)" = parity with Java (was 110 over-generated).
DONE this wave (committed, all gates green, bespoke unaffected):
- ArgCompiler.compileFaithfulMoveVariant: `(move <X> ...)` → faithful move class via a
  FAITHFUL_MOVE_VARIANTS map (currently {move:step → …effect.Step}), BEFORE the registry make<X>
  alias. compilePreferredTokenClass: faithful Is for (is Empty)/(is Enemy). Both additive+gated.
- Step.ts: trajectory-aware direction lookup; ActionMove marked decision.

THE REPEATABLE PATTERN (now proven — this is how the remaining grind goes; drive via codex waves):
  For each move variant / game class:
   1. Add `move:<x> → <faithful class>` to FAITHFUL_MOVE_VARIANTS (Slide/Hop/Add/Remove/Shoot/…),
      ensuring the faithful class has an @Opt-tail-defaulted positional ctor in Java arg order.
   2. Pick a representative game; write/extend a strict probe (correct move count + legality).
   3. Run the gates: probe + compile-guard (no faithful-compile regression) + bespoke parity slice.
   4. Fix the faithful eval bugs the probe surfaces (per-ludeme), commit, repeat.
  Climb the corpus until faithful ≥ bespoke parity, then DELETE bespoke (compiler1to1 + 268 *1to1 +
  registry make<X> adapters + Board1to1/Equipment1to1).
PROVEN WAVES this session: Topology subsystem, create() pass, move-dispatch — each codex-driven,
reviewed, independently verified, committed.

## Update 9: FULL faithful OUTCOME parity for representative games across ALL move families
The faithful single engine now plays COMPLETE games move-for-move AND computes the correct winner,
verified against recorded Java trials (LUDII_ARGCOMPILER=1, parity harness):
  Breakthrough / Leap Frog / Gomoku / Amazons → 100% OUTCOME_OK (0 MOVE_MISMATCH, 0 WINNER_MISMATCH).
Covers Step + Slide + Hop + Add + Shoot move families, moveAgain/phase flow, and reach/no-moves end
conditions. Bespoke never regressed across any wave.

WAVES THIS SESSION (each codex-driven, independently verified, committed; bespoke untouched):
  create() chain: Board.createTopology, Piece-extends-Component, Equipment.createItems, Topology
  subsystem, create() pass. Move dispatch: move:step/slide/hop/add/shoot via FAITHFUL_MOVE_VARIANTS +
  compileFaithfulMoveVariant. End/winner: IsIn region-normalize, (is In)->IsIn / (no Moves)->NoMoves
  direct binding, (sites Mover|Top|Bottom) preferred dispatch + rectangular-row fallback.

ACCEPTANCE HARNESS (reusable): probe-game.mjs <Game> [plies] (faithful vs bespoke first-moves),
probe-play.mjs (Breakthrough), probe-slide.mjs (Amazons), probe-compile-guard.mjs (10 games compile),
probe-topology.mjs; plus `LUDII_ARGCOMPILER=1 replay-trials --filter <Game>` for full OUTCOME parity.

REPEATABLE WAVE LOOP (proven 9×): probe a representative game → identify the move-family/eval/end gap
→ codex wave with multi-gate acceptance (target probe + all prior regressions + bespoke slice + tsc/
build) → independently verify every gate → commit. Each wave only ever GROWS parity.

KNOWN NEXT GAPS (from batch measurement): TTT/Hex deeper-ply MOVE_MISMATCH (Java-trial divergence past
opening); Nine Men's Morris / Oware compile-fallback (ArgCompiler throws → bespoke); Reversi
ForEachSite.eval; many games untested. Each is a next wave. Eventually: faithful ≥ bespoke across the
corpus → DELETE bespoke (compiler1to1 + *1to1 + registry make<X>).

## Update 10: broad faithful OUTCOME parity — ~14 games full, Tafl/Halma cluster started
FULL faithful OUTCOME_OK (move-for-move + correct winner vs recorded Java trials, LUDII_ARGCOMPILER=1):
  Breakthrough, Leap Frog, Gomoku, Amazons, Nine Men's Morris, Fanorona, Connect Four, Yavalath,
  Havannah, Nine Holes, Achi, Picaria, Squava, Tic-Tac-Four (~14), spanning placement / line /
  race-reach / jump-capture / territory / two-phase / morris, and Step·Slide·Hop·Add·Shoot move
  families + moveAgain/phase + reach·no-moves·is-Line·morris end conditions.
NOW STARTING (start() cleared, generate opening moves; per-game mechanics next): Tablut (custodial
  captures fire, plays to ~ply 27-34), Hnefatafl, Brandub (over-captures ply 5 — king/edge condition),
  Halma, Chinese Checkers.

WAVE LEDGER (this session, all codex-driven + independently verified + committed; bespoke never
regressed): Board.createTopology · Piece-extends-Component · Equipment.createItems · Topology
subsystem · create() pass · move:step · move:slide · move:add · move:hop · move:shoot+moveAgain ·
IsIn-normalize+end-winner(reach/no-moves) · is-Line(byLevel/through) · START_FAIL cluster
(Topology.centre + SitesCoords) · custodial capture (Tafl, partial).

REMAINING (per-game mechanics — declining ROI per wave, increasing complexity):
  - Brandub/Tafl king & edge capture conditions (finish custodial).
  - Go (ko/superko + group capture), Reversi (flip + ForEachSite), Konane (initial removals),
    Pente (custodial pair capture), 3D boards (3D Tic-Tac-Toe), Oware/mancala (sow + voting/cycle end).
  - Then: broad corpus sweep, fix the dominant remaining buckets, and once faithful >= bespoke across
    the corpus, DELETE the bespoke path (compiler1to1 + 268 *1to1 + registry make<X> + Board1to1/
    Equipment1to1). Note: the registry factories (batch*) are the ArgCompiler FALLBACK and are being
    superseded ludeme-by-ludeme as faithful classes get wired via FAITHFUL_MOVE_VARIANTS / preferred
    dispatch; they go away with the bespoke path.

PROVEN LOOP (repeat): wide `LUDII_ARGCOMPILER=1 replay-trials --filter <Game>` sweep -> pick the
cheapest high-value cluster (shared mechanic / shared error) -> codex wave with multi-gate acceptance
(target probe + ALL prior regression probes + the OUTCOME_OK set + bespoke slice + tsc/build) ->
independently verify every gate -> commit. Each wave only GROWS parity; STOP-if-risky guardrail keeps
partial results honest and net-positive.

## Update 11: Tafl cluster substantially done (~16 games full parity); harness OOM caveat
Added full faithful OUTCOME_OK: Tablut, Brandub (Tafl king win/capture: surround->trigger->is
Triggered->result + PieceTypeReachWin + Fortresses/Centre/Outer regions + faithful IsWithin). Tafl
move-gen + custodial capture are 0 MOVE_MISMATCH deep. Remaining Tafl: Hnefatafl still MOVE_MISMATCH
at ply ~75 (deeper variant).

CONFIRMED full faithful OUTCOME_OK (~16): Breakthrough, Leap Frog, Gomoku, Amazons, Nine Men's Morris,
Fanorona, Connect Four, Yavalath, Havannah, Nine Holes, Achi, Picaria, Squava, Tic-Tac-Four, Tablut,
Brandub.

WAVES (14 this session, all codex-driven + independently verified + committed; bespoke never regressed):
Board.createTopology · Piece-extends-Component · Equipment.createItems · Topology subsystem · create()
pass · move:step · move:slide · move:add · move:hop · move:shoot+moveAgain · IsIn-normalize+end-winner ·
is-Line(byLevel/through) · START_FAIL cluster(Topology.centre+SitesCoords) · custodial capture ·
custodial conditions · Tafl king win.

⚠ VERIFICATION CAVEAT (environment, not code): after a long multi-wave session the parity harness
(replay-trials.mjs) became OOM-flaky locally (node exit 137 on deep games like Tablut on repeated
runs) — system has ample RAM; it's per-process heap growth across the lud-corpus walk + deep replays.
The child-process probes (probe-game/probe-play/probe-slide/compile-guard/topology) stay reliable and
are the dependable move-gen regression gate. For RIGOROUS full-game OUTCOME verification of new
winner/end-condition waves, run in a FRESH shell (or add --max-old-space-size and run one game per
process). Future waves whose acceptance is OUTCOME parity SHOULD be verified with a working harness
before commit.

REMAINING (per-game mechanics, declining ROI): Hnefatafl deep; Go (ko/superko+group capture); Reversi
(flip+ForEachSite); Konane (initial removals); Pente (custodial pair); 3D boards; Oware/mancala (sow +
vote/cycle end). Then broad corpus sweep -> dominant buckets -> DELETE bespoke once faithful>=bespoke.

## Update 12: corpus measurement (~27% full faithful replay) + Konane phases + Context accessors
- Konane wave landed (15th): move:remove dispatch + faithful phases/nextPhase + opening regions —
  Konane plays its 3-phase opening == bespoke; deeper hop-continuation remains (bespoke itself
  mismatches Konane at ply 9).
- Context: Java-named accessors to()/from()/between()/site()/value()/player() (ForEachSite etc.).
- Fresh-shell harness re-verified Tablut + Brandub OUTCOME_OK 2/2 (closes Update 11's caveat).

CORPUS MEASUREMENT (strided random sample, 60 games, LUDII_ARGCOMPILER=1):
  13 OUTCOME_OK + 3 REPLAY_OK (~27% full replay) · 5 WINNER_MISMATCH · 38 MOVE_MISMATCH · 1 START_FAIL
  · 0 COMPILE_FAIL. Highlights: Chess replays 26 plies (REPLAY_OK_NO_OUTCOME); Breakthru 176 plies,
  J'odu (sow!) 202 plies, Twelve Men's Morris 120, Nerenchi Keliya 137 all OUTCOME_OK — the faithful
  engine generalizes well beyond the curated set.
DOMINANT REMAINING CLUSTER: **Sow/mancala** (board/sow/* ≈ 100 games; most MOVE_MISMATCH at ply 0-4)
  → Sow wave running (Select+sow+tracks; targets Galatjang/Ti/Fergen Gobale/Koro; J'odu stays green).

QUICK-WIN DIAGNOSTICS (queued for a small follow-up wave):
  - AllPassed.eval calls context.game() — TS Context has .game property; fix callers (cannot add a
    game() method over the property). Blocks Reversi end-eval.
  - Reversi move-gen still 0 (custodial-flip detection (sites Flips?) next).
  - SitesTrack.eval: ctxAny.track not a function (Tant Fant end) — track API on Context.
  - Surakarta: SlideFaithful.slideByTrack requires preComputedTracks on Context (track machinery).
  - Pente: emits 2 duplicate opening moves (171->171 twice) vs bespoke 1 — dedup/decision flag.
  - Mu Torere/Shisima (graph-board Step + conditions): faithful 0 moves at ply 0.
  - Dara: ArgCompiler compile fails entirely (falls back to bespoke Equipment1to1).

## Update 13: Sow-2 landed cleanly + MEASUREMENT HONESTY CORRECTION
Sow-2 (17th wave): the sow dispatch re-applied incrementally under hard canaries — and/or/not +
dynamic (sites {...}) as FALLBACK-after-candidates (the preference form caused the original
regressions), is Pending, (sites Track), set Count/Pending, region-if, move:select, plus
Move.to/fromAfterSubsequents, mapEntry hydration, counted FromTo, exact (is Mover), end-If ByScore.
ALL probes + OUTCOME set + bespoke green on the final tree. Galatjang ply 0→1; deep sow-variant
eval = Sow-3 follow-up.

⚠ MEASUREMENT HONESTY CORRECTION: the parity harness does NOT distinguish the faithful path from
the silent bespoke fallback (play1to1 catches ArgCompiler throws and falls back). Spot-check found
J'odu and Nine Men's Morris "OUTCOME_OK" actually run on Equipment1to1 (fallback), and the
"--filter Fanorona" green was Fanorona Telo (variant), not base Fanorona (which over-generates
ply 0: faithful 189 vs bespoke 4). CONSEQUENCES:
 - Prior "full faithful OUTCOME parity" lists conflate faithful wins with fallback wins. VERIFIED
   faithful-path (probe-game equip=Equipment + harness OUTCOME_OK): Breakthrough, Leap Frog, Gomoku,
   Amazons, Connect Four, Yavalath, Havannah, Tablut, Brandub, + the small line games. NOT faithful:
   J'odu, Nine Men's Morris (fallback); base Fanorona (diverges).
 - The corpus "~27% full replay" mixes paths. NEW measurement: probe-faithful-coverage.mjs — corpus
   sweep reporting equip=Equipment vs fallback + the fallback-reason histogram (drives wave choice);
   writes test/parity/faithful-coverage.json for wave-over-wave diffing.
 - Completion metric (definition item 1) must be read as: faithful-PATH parity (equip=Equipment),
   measured by the coverage probe x harness, not harness alone. The J'odu/Tablut/Breakthrough
   canaries remain valid as no-breakage gates, but only equip-verified games count as faithful wins.

## Update 14: coverage waves complete (81.8%); play-parity regime change understood
COVERAGE CAMPAIGN (4 waves): 36.4% -> 54.9% (Hand/Dice containers) -> 69.1% (MancalaBoard +
Tiling/Tri) -> 79.3% ([#] expansion + Value/Is/Move overloads) -> 81.8% (Sow-3 side-effect).
PLAY-PARITY waves: Sow-3 (Kalah + J'odu faithful OUTCOME_OK, J'odu guard removed, Galatjang ply 132);
small-games (Reversi/Mu Torere/Shisima faithful; Context tracks API; Tant Fant/Surakarta unblocked).

KEY MEASUREMENT INSIGHT (apples-to-apples window, stride-23): harness full-replay in the window went
13 OUTCOME_OK + 3 REPLAY_OK -> 7 + 1. NOT a regression: games that previously "passed" via silent
bespoke fallback now compile faithfully and expose their faithful play gaps. FLIPPED games (played
perfectly on bespoke -> now faithful + MOVE_MISMATCH): Achi, Liu Tsi, Nerenchi Keliya, Twelve Men's
Morris, Breakthru — the MORRIS family + Breakthru. These are ideal targets (Java parity proven
achievable by bespoke). EXPECT the harness aggregate to dip as coverage rises, then climb as faithful
play catches up. The true progress metric: equip-verified faithful play (strictly increasing:
J'odu 202 plies, Kalah, Reversi, Mu Torere, Shisima, ... all newly faithful-playing).
REMAINING PLAY CLUSTERS (from the 92-trial sample): morris family (flipped), AlquerqueBoard hunt
family (ply-0 span), dice/track race games (ply-0), chess family (ply-0 MOVE_MISMATCH; base Chess
replays 26 plies), Tant Fant over-generation, Surakarta track breadth, Pente coordinate resolver.

## (earlier) move-dispatch plan — now DONE (see Update 8):
  1. Make ArgCompiler route `(move X ...)` to the faithful move class: when the constructKey is
     `move:<x>` and JAVA_TS_CTORS has the faithful class (StepFaithful, SlideFaithful, …), prefer
     faithful instantiation over the registry make<X> alias. (instantiateFaithful currently never
     sees the `.effect.Step` className for `(move Step ...)`.)
  2. Ensure the faithful move classes' positional ctors match Java arg order (StepFaithful already
     does: from,directions,to,stack,then) and that ArgCompiler binds the directions/`(to ...)`/
     sideEffect args into them.
  3. Acceptance: probe-play.mjs shows ~22 Breakthrough moves (not 110), occupancy-filtered, with the
     capture side-effect; then widen to other direction-based games.
  4. Then the per-ludeme eval grind continues; delete bespoke (compiler1to1 + *1to1 + registry/
     make<X> adapters) once faithful ≥ parity.
