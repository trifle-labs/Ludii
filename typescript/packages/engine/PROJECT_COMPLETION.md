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
