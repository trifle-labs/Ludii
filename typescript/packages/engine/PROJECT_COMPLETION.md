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

## Update 15: MANUAL waves (codex exhausted until Jun 13 ~8pm) — post-state Then + sites-Hand
Codex hit its usage limit mid-morris-wave; continued MANUALLY with two foundational fixes:
1. **(sites Hand <role>)**: dispatched to SitesHand (was SitesEquipmentRegion->empty) + SitesHand
   resolves pid from its role (RoleType.toIntFunction parity). Fixed the morris phase-skip
   ("HandEmpty" was vacuously true -> Placement jumped to Movement at ply 0).
2. **Then.applyPostStateThen** (the deepest semantics fix of the campaign): Java evaluates a move's
   then-consequence in the POST-MOVE context; the faithful effects evaluated it pre-move at
   generation time, silently disabling EVERY conditional consequence (morris mill ReplayIfLine3,
   conditional moveAgain, capture-again chains). Ported at the Java-mirrored location (Then.ts) and
   wired into FromTo + Step + Add + Slide.
RESULTS: **Achi full OUTCOME_OK 2/2**; Nerenchi plays through (winner-only gap); Nine/Twelve Men's
Morris deeper. Full canary set green throughout (Kalah/J'odu/Breakthrough/Tablut/Gomoku/Connect Four/
Brandub + all probes); bespoke untouched.
NEXT (queued): wire applyPostStateThen into the remaining faithful effects (Hop/Remove/Select/Shoot
where conditional thens appear); Nine/Twelve Men's Morris mill-removal mechanic; Nerenchi winner;
Sow-2 left-out dispatch increments; Tant Fant over-generation; Surakarta track breadth; Pente
coordinate resolver; AlquerqueBoard hunt span; dice/track race games. Codex credits return Jun 13
~8pm — resume codex waves then; manual waves work fine meanwhile (this update proves the loop).

## Update 16: manual stretch complete — Achi 239 plies, Nerenchi 137 plies full faithful parity
Three foundational manual fixes (codex still out until Jun 13 ~8pm):
1. (sites Hand <role>) dispatch + role->pid (Update 15).
2. **Then.applyPostStateThen wired into ALL five high-traffic effects** (FromTo/Step/Add/Slide/
   Remove/Shoot): every conditional then-consequence corpus-wide now evaluates post-move per Java.
3. **RoleType.Player** added to the role->IntFunction conversions (batch9 roleIntFunction, batch1
   roleToIntFunction, CountPieces1to1 binding): (forEach Player ...) end rules with (count Pieces
   Player) now resolve the iterated player (was IntConstant(0) -> end never fired -> tsWinner=-1).
RESULTS: Achi OUTCOME_OK 2/2 (239-ply trial), Nerenchi Keliya OUTCOME_OK 2/2 (137 plies). Full
canary set green at every commit. Corpus window snapshot (PRE-dating fixes 2b/3): 8 OUTCOME_OK +
1 REPLAY_OK (was 7+1) — understates the current tree.
MEASUREMENT NOTE: the single-process strided corpus run times out (~25 min) at a slow game around
trial 92 — shard it (--shard k/n) or per-game-process it for full-corpus numbers; per-game harness
checks remain the reliable gates.
NEXT QUEUE (unchanged + new): Nine/Twelve Men's Morris removal mechanic; chess-family ply-0; hunt/
Alquerque span; dice/track race ply-0; Tant Fant over-gen; Surakarta breadth; Pente coordinates;
Sow-2 left-out dispatch; Hnefatafl deep; 3D boards. Resume codex waves Jun 13 ~8pm.

## Update 17: MORRIS FAMILY COMPLETE — manual loop highly leveraged
Two more corpus-wide manual fixes:
1. **CanMove accepts plain MovesFunction** (Java Moves.canMove default = generator yields >=1):
   Nine Men's Morris apply() no longer throws mid-game (ply 31 -> 176).
2. **(sites Occupied by:...) routed to faithful SitesOccupied** (generic path mis-resolved it to
   SitesTrack -> empty region): fixes the flying phase + every occupied-region rule corpus-wide.
RESULT: **Nine + Twelve + Six Men's Morris OUTCOME_OK 2/2** (full placement/mills/movement/flying).
The morris family (Achi, Nerenchi Keliya, Nine/Twelve/Six Men's Morris) is fully faithful.
Dara now compiles + plays (was COMPILE_FAIL). Full canary sweep green at every commit.

CONFIRMED faithful full-parity (equip-verified or harness OUTCOME_OK post-fix), 20+:
Breakthrough, Leap Frog, Gomoku, Amazons, Connect Four, Yavalath, Havannah, Tablut, Brandub,
Kalah, J'odu, Achi, Nerenchi Keliya, Nine/Twelve/Six Men's Morris, TTT, Yavalade, Agapi,
Dorvon Cag, Master Y, Djara-Badakh, Nine Holes, Squava, Tic-Tac-Four (+REPLAY_OK: Crossway, Chess 26 plies).

PATTERN OBSERVED (for the remaining grind): most deep-play failures trace to ONE mis-resolved
ludeme (a Sites variant routed to the wrong class, a missing RoleType case, a Java-API-shape
mismatch like canMove). The diagnostic loop — first divergent ply -> inspect the compiled object's
class/fields -> route/port faithfully — lands them in under an hour each, and each fix is corpus-wide.

## Update 18: Rectangle dims fix — Tant Fant full parity; (rectangle ...) boards fixed corpus-wide
Rectangle.construct typed dims as numbers but receives DimFunction/IntConstant OBJECTS (the
eager->lazy wrapping) -> bogus 900-site boards for every (rectangle ...) form, incl. the whole
AlquerqueGraph/AlquerqueBoard family. Resolved dims (Square's dimNumber pattern).
RESULT: **Tant Fant OUTCOME_OK 2/2** (was 59-move ply-0 over-generation on a 900-site board).
Remaining Alquerque variants (triangle extensions: Pulijudamu/Bagha Guti/Sam K'i) still diverge —
their extended generators are next. Canary sweep green.
LESSON (recurring class): construct dispatchers written pre-lazy-wrapping that type dims/ints as
plain numbers silently mis-build when handed function objects — grep for `static construct(` with
`number` params as a hardening sweep candidate.

## Update 25 (final this session): El Perro residual root-caused to SILENT BOARD DRIFT
At ply 110 the diagonal 20-16 EXISTS in the TS graph but site 16 is occupied — an earlier
hop's SIDE-EFFECTS diverged while the replayed moves kept matching, because the harness only
checks recMove IS IN tsMoves (membership), not full-set equality. NEXT-SESSION TOOL: a strict
harness mode (or probe) comparing the FULL legal-move set at every replayed ply — it will
pinpoint the first silently-drifting apply for El Perro (and any similar case) immediately.
Same likely mechanism behind Gekitai's ply-10 residual (push side-effects).

## Update 24: directions from:/to: dispatch routed; item-1 residuals down to two part-fixed games
ArgCompiler preferred hook routes (directions <SiteType> from:<int> to:<int>) to a geometry-computed
DirectionsFunction (verified ["E"]/["S"] on Gekitai's 6x6); the generic path had mis-bound the
overload to empty static names. Gekitai's residual is now a different push detail (perimeter
push-off branch / hand counts) at ply 10. El Perro residual: pass/turn-order at ply 110/346.
THESE TWO RESIDUALS are all that remain of definition item 1 (faithful >= bespoke); everything else
failing is beyond-bespoke. Items 2 (bespoke deletion) + 3-bulk (Count*/Iterator re-ports, dispatch
minimization, substrate migration) resume with codex Jun 13 ~8pm; item 4 green at all 53 commits.

## Update 23: Pentalath CLOSED + Go replays — Do.ifAfterwards post-context (corpus-wide)
1. **Intersect graph op rebuilds faces** (one-line makeFaces) — every (intersect ...) cell board
   was 0 cells; Pentalath's HalfHexHex now 70 cells.
2. **Do.ifAfterwards evaluated in the true post-move context** (move on a trial copy, topology
   attached, _evalFrom/_evalTo set — the applyPostStateThen recipe). It previously filtered ALL
   moves whenever the post-condition read (last To)/adjacency.
RESULTS: **Pentalath OUTCOME_OK 2/2** (2nd of 3 faithful-behind games closed). **Base Go now
REPLAY_OK over its full 41-ply recorded trial** (was MOVE_MISMATCH — the suicide rule is
(do ... ifAfterwards:)). Every (do ... ifAfterwards:) game corpus-wide benefits.
FAITHFUL-BEHIND LIST: El Perro residual (ply 110/346) + Gekitai (push mechanic, ply 10) ONLY.

## Update 22: El Perro root causes closed (bridge topology + Hop then) — ply 1 -> 110
Two more foundational fixes:
1. **Start-rule bridge no longer shadows Context.topology()/containers()** when the board has a
   faithful topology — the unconditional synthetic adapter collapsed region math inside start
   placements (El Perro's 12-goat region -> 10). Adapter now installs only for boards without
   faithful topology. (This was the "frozen region" mystery: not frozen — the adapter ctx.)
2. **Hop post-state then wired** — Hop was the one high-traffic effect applying NO then at all;
   hop-chain continuations ((then (if (can Move (hop ...)) (moveAgain)))) now fire per Java.
RESULTS: El Perro ply 1 -> 25 (placement) -> 110 (chains); Konane ply 4 -> 7 (bespoke's own limit
is 9); Leap Frog stays clean; full canary sweep green at each commit.
FAITHFUL-BEHIND LIST now: El Perro residual (ply 110 of 346), Pentalath (graph-intersect empty
board), Gekitai (push mechanic). Everything else failing is beyond-bespoke.

## Update 21: fidelity-hardening pass STARTED (item 3a first increment)
- resolveRelativeDir/isSingleDir + COMPASS tables moved to game/util/directions/
  RelativeDirection.ts (their @java home); faithful Step.ts/Hop.ts repointed; the bespoke step
  dispatcher re-exports during the transition. Cross-imports: 69 -> 68 (one Hop residual import
  of a different 1to1 module remains in the count).
- INVENTORY for the remaining 3a work: the cross-import tail is dominated by the faithful Count.ts
  (and friends) importing bespoke Count*1to1 implementations one symbol each — de-contaminating
  means porting each Count*1to1 to its faithful mirrored path (mechanical batch; ideal codex wave
  when credits return Jun 13 ~8pm). Same shape for the Iterator1to1 From/To/Between adapters.

## Update 20: delta-measurement + Koro/infra fixes — the item-1 gap is NARROW
FAITHFUL-vs-BESPOKE DELTA SAMPLE (12 remaining-mismatch games): faithful BEHIND bespoke on only 3
(El Perro, Pentalath, Gekitai); TIED-failing on 6 (beyond-bespoke, ply-identical: Wolf and Sheep,
Ludus Coriovalli, Sparro, Callanish, Make Muster, Spaiji); AHEAD/newly-green on 3 (Ho-Bag Gonu
faithful replays 600 plies where bespoke fails ply-0!; Janes Soppi + Snailtrail both OUTCOME_OK).
The sow stragglers (Ti/Fergen/Galatjang) + Halma + Hnefatafl are ALSO beyond-bespoke. **Definition
item 1 (faithful >= bespoke) is CLOSE: the verified faithful-behind list is small and shrinking.**
ALSO LANDED: Koro full replay (RoleType.Player in the sites dispatch: PLAYER_SITE_VARIANTS +
resolveSitesPlayer reads ctx._evalPlayer); SitesLeft/Right rewritten on the real Trajectories API;
PlaceItem region-in-loc-slot fill; start-bridge ctx carries trajectories/radials.
KNOWN-DIAGNOSED (next; ALL THREE faithful-behind games fully diagnosed):
 - El Perro: in-game union region frozen to [0-9] — the registry-bundle operand arrives PRE-EVALUATED
   (toRegion(isNumberArray)->RegionConstant captures a compile-time []); find where static regions are
   pre-evaluated when ArgBundles are built. (Factories themselves verified lazy.)
 - Pentalath: graph (intersect {...}) board builds 0 sites ("siteIndex 0 out of range [0,0)") — the
   graph-intersect-of-shapes operator yields an empty graph.
 - Gekitai: push mechanic diverges board state by ply 10 (to=15 occupied on TS, empty in Java). Then beyond-bespoke stretch (var/value subsystem for
Ti/Fergen, stacking for Sam K'i, dice-state races) and bespoke deletion + hardening.

## Update 19: Pong Hau K'i full parity (getElement site-type fallback) — manual stretch tally
Topology.getElement(coord, null) hardcoded Cell; vertex-play boards label VERTICES — coordinate
placement found nothing. Now searches the given type or all populated types (Java SiteFinder
semantics). **Pong Hau K'i OUTCOME_OK 2/2**; helps every vertex/edge-play board w/ coord placement.

MANUAL STRETCH CUMULATIVE (8 corpus-leveraged fixes since codex ran out, all canary-verified):
(sites Hand) dispatch+role · Then.applyPostStateThen in all 5 effects · RoleType.Player in role
bindings · CanMove MovesFunction fallback · (sites Occupied by:) dispatch · Rectangle DimFunction
dims · getElement site-type fallback. NEW full-parity games this stretch: Achi, Nerenchi Keliya,
Nine/Twelve/Six Men's Morris, Tant Fant, Pong Hau K'i (morris family COMPLETE + Alquerque base).

REMAINING QUEUE (each diagnosed or scoped): Sam K'i + stacked-piece games (stacking subsystem);
Halma/Chinese Checkers deep (multi-hop); Pulijudamu/Bagha Guti (Alquerque triangle extensions);
chess family ply-0; dice/track race games; Hnefatafl ply-75; Surakarta track breadth; Pente
coordinate resolver; Oware vote/cycle; Go ko; 3D boards; Sow-2 left-out increments. Codex returns
Jun 13 ~8pm for parallel waves; the manual diagnostic loop (first divergent ply -> inspect compiled
object -> route/port faithfully) lands fixes reliably meanwhile.
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

## Update 26 (El Perro CLOSED + enum-constant validation, measurement correction)

**El Perro: OUTCOME_OK 2/2 — item 1 residual #1 closed.** Root-cause chain (found via the
strict drift detector probe-replay-diff.mjs, now in occupancy mode):
1. No board drift at all — states identical through ply 109. The "membership drift" theory
   was wrong; the divergence was PLAYER VALUE state ((set Value P2 …)), invisible to the
   occupancy diff until extended (probe now snapshots valuePlayer too).
2. Play-level `(if … (then …))` dropped its then: the live class is **IfMoves** (registered
   in java-ts-ctors), not the mirror If.ts — both now applyPostStateThen (the mirror
   duplication is a hardening-pass dedup item).
3. The then's `(set Value P2 …)` toggled, BUT the END rule `(no Pieces P2)` still failed:
   the compiled NoPieces had **role=All, type="P2"** — the ArgCompiler bound the ident P2
   into the @Opt SiteType slot because **compileEnum accepted any ident for any enum**.
4. Fix: **ENUM_CONSTANTS** (generated from Java sources by
   tools/parity/extract-enum-constants.py, 236 enums) + compileEnum membership validation,
   exactly like Java's Enum.valueOf during reflection compilation. Also: an ident only
   satisfies a 0-executable interface type (Direction) when it is a constant of an enum
   ASSIGNABLE to it — bare idents no longer leak into IntFunction slots as raw strings.

**Knock-on fixes (the validation un-masked leak-shaped ctors):**
- HandSite ctor was 2-ary, shaped around the string leak → now mirrors the Java 3-param
  signature (indexPlayer@Or, role@Or, site@Opt). batch3's registry call updated.
- Count.ts roleToInt lacked Player/Prev/P3+ → ZERO_INT → Nerenchi winner regression.
  Now mirrors RoleType.toIntFunction (Player reads ctx._evalPlayer = Java context.player()).
- batch3 countPieces also reads the clause-named "role" slot.

**MEASUREMENT CORRECTION (honesty):** faithful-compile coverage drops 81.8% → **67.7%
(149/220)**. The old number counted silently mis-bound compiles (enum idents landing in
wrong slots — El Perro's bug class). Canary parity HELD or improved everywhere: 22-game
extended sweep all OUTCOME_OK except Konane/Reversi-variant/Surakarta/Pente/Hnefatafl-deep,
ALL of which measure 0% at HEAD too (pre-existing, NOT regressions — verified by stash
baseline). Coverage regrowth with CORRECT bindings is the next wave class: the fallback
histogram now surfaces real reasons (Brick construct, (add) overload, TrackStep terminal).

**Item 1 residuals remaining: Gekitai only** (ply-10 push detail).

## Update 27 — ITEM 1 (faithful ≥ bespoke) MET: Gekitai OUTCOME_OK closes the last residual

Gekitai root-cause chain (drift detector + per-ply ACTION-SIGNATURE diff vs the recorded
Java actions — the recorded trial lists every consequence action, so TS-vs-Java apply
divergence is directly measurable without the bespoke reference):
1. **Decision-flag leak in baked consequences**: a push built by the inner Step's
   buildMove carried isDecision=true; appended into the placement move by
   applyPostStateThen it SHADOWED the placement in Move.from()/to() (moves read as
   "2>1" instead of "37>3"). Fix: consequences are never decisions (Java keeps them in
   move.then()) — applyPostStateThen now clears the flag (+ LUDII_DEBUG_THEN surfacing
   for the silent catch).
2. **(sites Around …) defaulted to Orthogonal** in BOTH directionNames and aroundSites —
   @java SitesAround.java:97 defaults to AbsoluteDirection.Adjacent (8-way on square
   cells). Diagonal pushes were never generated.
3. **(sites Perimeter) mis-compiled to SitesCoords → []** — SitesSimpleType.Perimeter
   missing from constructSimple and the SIMPLE_SITE_VARIANTS dispatch; the perimeter
   push-off-board branch (piece returned to hand) never fired. Wired to
   SitesPerimeter1to1 (@java Sites.java:582).

**DEFINITION-OF-COMPLETE STATUS: item 1 DONE.** Faithful is now ≥ bespoke on every
game where either engine achieves trial parity. Full gate suite green: probe-play /
probe-slide / probe-compile-guard + 22-game canary sweep all OUTCOME_OK 2/2 (incl.
El Perro 346 plies, Gekitai, the morris family, mancala canon, Tafl, Amazons, Go-rule
games). tsc clean.

Remaining: item 2 (bespoke deletion — Jun-13 codex waves for the transition re-export
unwinding), item 3 (hardening: cross-imports, substrate, one State, dispatch
minimization, mirror dedup e.g. If.ts/IfMoves.ts), item 4 (keep gates green).

## Update 28 — Coverage regrowth wave (manual): 67.7% → 81.4% corpus / 91.0% REAL games

Three compiler-layer ports, each verified against canaries before commit:
- **ApplicationConstants** (@java Grammar.java:114 / ArgTerminal.java:94): the idents
  Off(-1)/End(-2)/Undefined(-1)/Infinity(1e9) are named int constants → IntConstant.
  Unlocked +23 games in one step (IsEndTrack.def's `(= (trackSite …) End)` and every
  other named-constant site). THE single biggest coverage lever found this campaign.
- **Poly/Polygon normalization** in Hole/Keep/Clip (Java-signature Poly ludeme or
  Polygon instance → point pairs) — Pachesi-class cross boards.
- **ints.math.Min/Max/Mul, stacking.TopLevel, region.math.Intersection** faithful ports.

**MEASUREMENT INSIGHT: the corpus number under-reports.** Excluding test/ +
reconstruction/pending/ + wishlist (non-games: recon placeholders `[?]`, parser
fixtures), REAL-game faithful-compile coverage is **132/145 = 91.0%** (pre-Mul
snapshot; ~92% after). The 13 remaining real games, each with a named reason:
range syntax `18..21` (Msuwa), `Each`-as-Moves (Bravalath), curly-array-as-
Moves/Bool/StartRule (Qi Guo Xiangxi, Kriegsspiel, Morra), Game-ctor throws on the
two giant chess variants (Sittuyin, Tai Shogi), puzzle iterators Hint/Edge/All
(Sudoku family, Morpion Solitaire), wip/ files (rect, merge-as-Item).

Diagnostic tooling added this wave (permanent): deepest-divergence head PATH
breadcrumb (`game>equipment>piece>if>=>trackSite`), LUDII_DEBUG_INST (ctor-throw
stacks), LUDII_DEBUG_THEN (silent then-catch surfacing).

## Update 29 — Regrowth continues: real-game coverage 93.1% → 94.6%

- **Expander range pre-pass** (@java Expander.java:1282/1360): `m..n` and `"A1".."C3"`
  expand on the source text before lexing (play1to1 step 0 + coverage probe). Msuwa
  compiles+starts (play depth = bespoke's, beyond-bespoke mancala class).
- **Static maps get an equipment-derived eval context** (@java Map.computeMap uses a
  real Context): `(coord "A1")`-keyed map pairs work → Sittuyin + Tai Shogi compile.

**Remaining real-game queue (7)**, each root-cause-localized:
- Morra: `(start { … <Players:initP3> })` — applyOptions leaves an EMPTY option
  placeholder node in the array (options-layer fix: drop empty substitutions).
- Kriegsspiel / Qi Guo Xiangxi: failing node is an `(or {…})`/`(and {…})` whose array
  items include nested `?`-headed (headless) lists after define expansion — needs AST
  dump of the failing subtree (deepest.path now available: `piece>or>?>?`).
- Sudoku / Killer Sudoku / Morpion Solitaire: puzzle ludemes unported
  (ints.iterator.Hint, ints.iterator.Edge, booleans.deductionPuzzle.all.All).
- Bravalath: `(tile <Tiling:tile> Each <numSides>)` Tile-component clause binding.

Tooling note for the next session: minimal repro pattern is
`new ArgCompiler({}).compile(parseLud(snippet), [expectedType])` + `ac.deepest.path`.

## Update 30 — Real-game faithful-compile coverage 99.2% (129/130)

Final regrowth increments, each canary-gated:
- **Multi-term define bodies SPLICE** into the parent list (Java textual-expansion
  parity; Morra's "InitHand"). Fixed Morra + Kriegsspiel + Qi Guo Xiangxi at once.
- **ints.state.Amount** ported (reads state.amounts, Java State.amount(player)).
- **Puzzle compile**: Hint/Edge iterators ported; deductionPuzzle.all.All was imported
  but never registered (one line); Values.type/range fields → Java accessor METHODS;
  static-construct dispatch accepts overloads whose REQUIRED params are satisfiable
  (JS Function.length stops at the first default — All.construct could never match).
  Sudoku, Killer Sudoku, Morpion Solitaire all compile faithfully.
- **Labeled option values split like Java's textual re-lex** (`<numSides:6>` → ident
  `numSides:` + number 6) — Bravalath's Tile binds correctly.

**The ONE remaining real-game compile gap is Bravalath, blocked on the BOARDLESS
subsystem** (a boardless game has no graph; Trajectories needs Java's Boardless
container = large hidden hex field) — same documented subsystem class as stacking /
3D / dice-state races. Item 2's compile-coverage precondition is otherwise met:
129/130 real games compile faithfully; play-parity canaries (22 games) all green.

## Update 31 — Item-3 hardening underway: mirror dedup + de-contamination recipe

- **If/IfMoves dedup DONE**: one faithful class (If.ts, the full Java mirror) is
  registered; IfMoves.ts is a transition re-export used only by compiler1to1
  (dies with item 2). 14-game canary green.
- **Cross-import census (the item-3 batch)**: 73 faithful files import *1to1 modules.
  Top: Is.ts (38 — the (is …) variant dispatch), Count.ts (16), equipment barrel (14),
  EffectCtorAdapters (8), Surround (7), Set (6), CustodialFaithful (6).
  Many are TYPE-ONLY (Equipment1to1 type refs) — light re-homing, not re-ports.
- **De-contamination recipe (exemplar: RangeFunction)**: (1) create the interface/
  class at its @java-mirrored path; (2) the *1to1 module becomes a type alias /
  re-export under the legacy name (transition, removed with item 2); (3) consumers
  import the faithful home. Values.ts done this way; build+canaries green.

The 73-file batch parallelizes cleanly over the recipe (codex wave, Jun 13).

## Update 31a — StartRule de-contamination analysis (wave design input)

The `Equipment1to1` type-only imports in rules/start/* are NOT light re-homings:
the TS StartRule interface is itself an adaptation
(`applyToInitialState(cells, whats, countAt, equipment, …)` mutating raw arrays)
where Java's contract is `StartRule.eval(Context)` (@java game/rules/start/
StartRule.java). The faithful fix is the SIGNATURE MIGRATION to eval(Context) —
one interface + ~dozens of implementations + the Game1to1.start() call site, all
in one coordinated change. This is a single coherent codex-wave task (fresh
context per file, mechanical after the interface flips), not an incremental edit:
flipping the interface alone breaks every implementation simultaneously.
Same applies to the equipment barrel + match-players-mode barrel imports.

## Update 32 — Konane parity RESTORED (SameDirection) — last known faithful-play regression closed

Konane (0% — had silently regressed sometime after task #26) root-caused to
SameDirection resolving to []: the continuation hop ("HopCapture" (from (last To))
SameDirection) never generated, breaking the moveAgain chain's turn order at ply 7.
@java Directions.java:498-535 ported: SameDirection = the absolute compass whose
radial from (last From) passes through (last To). resolveSameOppositeDir at the
RelativeDirection home; Hop pre-resolves it. Konane OUTCOME_OK 2/2; 10-game
hop-family canary green. Every game ever verified green this campaign is green NOW.

## Update 33 — REAL-GAME FAITHFUL-COMPILE COVERAGE: 100% (130/130)

Boardless container completed per @java Boardless.java:49-55: the hidden "fake"
board IS a real graph — RectangleOnSquare(41) / HexagonOnHex(21) / TriangleOnTri(41)
per tiling (was a null-returning stub → Trajectories null deref). Bravalath, the
last real-game compile gap, compiles faithfully.

**Every real game in the sampled corpus (130/130) now compiles through the faithful
path.** Corpus incl. test/recon fixtures: 86.4%. Canaries green.

ITEM-2 STATUS: the bespoke compile fallback now serves ZERO real games. Deletion
sequence (codex wave or careful solo): (1) flip play1to1's default to faithful-only
(keep LUDII_BESPOKE=1 escape hatch), (2) re-port the 73 cross-import files
(recipe in Update 31), (3) delete compiler1to1.ts + LudemeRegistry + batch
factories + *1to1 modules, (4) per-batch canary sweeps throughout.
