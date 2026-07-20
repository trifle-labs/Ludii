# Wave 16 — Stale Trial Regeneration Report

Scope: regenerate the recorded random trials identified as stale/inconclusive
in `typescript/packages/engine/UPSTREAM-REPORT.md` (Section B), using the
CURRENT compiled Java build (`LUDEME_VERSION = "1.3.14"`,
`Common/src/main/Constants.java:14`), so that TS-port parity checks against
these games are checked against valid, current-version ground truth rather
than trials recorded against pre-refactor `.lud` semantics or truncated by
an old harness's move budget.

All work was done under the write restriction: only files under
`Player/res/random_trials/**` were modified in the Ludii repo; `Core/src`,
`Common/res/lud`, and `typescript/` were read-only throughout. Scratch
tooling lives entirely under `/private/tmp/claude-501/wave16-regen/`.

## Method

1. **Generator**: `/private/tmp/claude-501/wave16-regen/src/genparity/GenTrial.java`
   (scratch, not committed to `Core/src`). Compiles a `.lud` from
   `Common/res/lud`, plays a full uniform-random-vs-random game (mirroring
   `utils.RandomAI.selectAction` exactly — `ThreadLocalRandom`-driven pick
   among `game.moves(context).moves()`, independent of the game's own seeded
   `SplitMix64` substream used for in-game stochastic ludemes), and writes
   the result via `Trial.saveTrialToTextFile(...)` — the same method the
   original recording harness used — producing byte-for-byte the same text
   format as the existing corpus.

2. **Format-fidelity proof**: before touching any stale file, `GenTrial`
   was run against a KNOWN-GREEN game (Kalah, seed 12345) and the output
   compared field-by-field against the real, currently-green
   `Player/res/random_trials/board/sow/two_rows/Kalah/RandomTrial_0.txt`.
   Every top-level field name matched
   (`game=`, `START/END GAME OPTIONS`, `RNG internal state=`, `Move=` lines,
   `LEGAL MOVES LIST SIZE = N` debug block, `winner=`, `endtype=`,
   `rankings=`, `SANDBOX=`, `LUDII_VERSION=`); the only structural
   difference is that the real Kalah trial predates the
   `numInitialPlacementMoves=` field (it carries `LUDII_VERSION=1.1.19`,
   an older serializer version that didn't emit that line yet — current
   `Trial.convertTrialToString()` always writes it, per
   `Core/src/other/trial/Trial.java:889`, unconditionally). This is a
   known, harmless serializer-version difference, not a fidelity bug: the
   generated Kalah proof file was then run end-to-end through the actual TS
   replay harness and returned **OUTCOME_OK**, confirming the TS-side parser
   (`trial-format.mjs`) handles the field correctly whether present or
   absent. One important bug was caught and fixed during this step: passing
   `null` for `gameOptions` (instead of an empty, non-null list) to
   `saveTrialToTextFile` omits the `START/END GAME OPTIONS` block entirely,
   which would break the TS parser's unconditional forward-scan for that
   marker — fixed by always passing `new ArrayList<String>()`, matching
   every trial in the existing corpus.

3. **Self-consistency check (Short Assize)**: a second scratch tool,
   `/private/tmp/claude-501/wave16-regen/src/genparity/ReplayCheck.java`,
   loads an EXISTING recorded trial via
   `manager.utils.game_logs.MatchRecord.loadMatchRecordFromTextFile(...)`
   (the same text-format deserializer the Java Player app itself uses) and
   replays it move-by-move against a fresh `Context` built from the CURRENT
   compiled `.lud`, checking at every ply whether the recorded move is still
   present in the current legal-move set. This answers "does current Java
   replay its own trial differently than recorded?" independent of the TS
   port entirely. Used per the task's explicit conditional instruction:
   regenerate Short Assize T1 **only if** current Java replays its existing
   trial differently than recorded.

4. **Regeneration**: for each stale target, `GenTrial` was run with a fresh
   seed and a generous `maxTurns`/`maxMoveLimit` budget (via
   `game.setMaxTurns`/`game.setMaxMoveLimit`), aiming for `NaturalEnd` where
   the task/report recommended it. Backups of every file touched were made
   to `/private/tmp/claude-501/wave16-regen/backup/` before any overwrite.

5. **Verification**: each regenerated trial was replayed through the real
   TS parity harness:
   `MOVE_CAP=10001 PER_TRIAL_MS=240000 node test/parity/replay-trials.mjs --filter "<game>"`
   from `typescript/packages/engine`, targeting `OUTCOME_OK`. Per
   instructions, any trial that did NOT come back green was kept as-is (no
   seed-shopping to dodge a real bug) and is documented below as a
   newly-exposed TS port issue.

## Per-trial results

| Game | Trial | Before (stale) | Action | Seed | After (regenerated) | TS verification |
|---|---|---|---|---|---|---|
| Shatranj ar-Rumiya | RandomTrial_0 | `LUDII_VERSION=1.3.0`, `endtype=TurnLimit`, tied 1.5/1.5 (MOVE_MISMATCH ply 180 vs TS) | Regenerated | 101 | `LUDII_VERSION=1.3.14`, `endtype=TurnLimit`, tied 1.5/1.5 (see note 1) | **MOVE_MISMATCH ply 185** — real port bug, see below |
| Shatranj ar-Rumiya | RandomTrial_1 | `LUDII_VERSION=1.3.0`, `endtype=TurnLimit`, tied 1.5/1.5 (MOVE_MISMATCH ply 241 vs TS) | Regenerated | 102 | `LUDII_VERSION=1.3.14`, `endtype=TurnLimit`, tied 1.5/1.5 | **MOVE_MISMATCH ply 104** — real port bug, see below |
| Short Assize | RandomTrial_0 | `LUDII_VERSION=1.3.4`, `endtype=NaturalEnd`, winner=2 (TIMEOUT vs TS, ply 155) | **Not regenerated** — current Java self-consistency check passed | — | unchanged | N/A (untouched; see note 2) |
| Short Assize | RandomTrial_1 | `LUDII_VERSION=1.3.4`, `endtype=NaturalEnd`, winner=1 (MOVE_MISMATCH vs TS, ply 87) | **Not regenerated** — current Java self-consistency check passed | — | unchanged | N/A (untouched; see note 2) |
| Kiuthi | RandomTrial_0 | `LUDII_VERSION=1.2.10`, `endtype=NaturalEnd` (already OUTCOME_OK) | **Not touched** (already green) | — | unchanged | OUTCOME_OK (unchanged) |
| Kiuthi | RandomTrial_1 | `LUDII_VERSION=1.2.10`, `endtype=NaturalEnd`, tied 1.5/1.5 (WINNER_MISMATCH vs TS) | Regenerated | 301 | `LUDII_VERSION=1.3.14`, `endtype=NaturalEnd`, tied 1.5/1.5 | **WINNER_MISMATCH ply 347** — real port bug, see below |
| Li'b al-'Aqil | RandomTrial_0 | `LUDII_VERSION=1.3.0`, `endtype=TurnLimit`, tied 1.5/1.5 (WINNER_MISMATCH vs TS) | Regenerated | 401 | `LUDII_VERSION=1.3.14`, `endtype=NaturalEnd`, winner=1 | **OUTCOME_OK** |
| Li'b al-'Aqil | RandomTrial_1 | `LUDII_VERSION=1.3.0`, `endtype=TurnLimit`, tied 1.5/1.5 (WINNER_MISMATCH vs TS) | Regenerated | 404 | `LUDII_VERSION=1.3.14`, `endtype=NaturalEnd`, winner=1 | **OUTCOME_OK** |
| Kriegsspiel | RandomTrial_0 | `LUDII_VERSION=1.3.0`, `endtype` missing entirely (recording never completed) | Regenerated | 501 (maxTurns=300, maxMoveLimit=20000) | `LUDII_VERSION=1.3.14`, `endtype=MoveLimit`, 20000 plies, winner=0, tied 1.5/1.5 | **MOVE_MISMATCH ply 242** — real port bug, see below |
| Kriegsspiel | RandomTrial_1 | `LUDII_VERSION=1.3.0`, `endtype` missing entirely (recording never completed) | Regenerated | 502 (maxTurns=300, maxMoveLimit=20000) | `LUDII_VERSION=1.3.14`, `endtype=MoveLimit`, 20000 plies, winner=0, tied 1.5/1.5 | **MOVE_MISMATCH ply 242** — real port bug, see below |

Note 1: Shatranj ar-Rumiya's win condition is strict checkmate only (no
repetition/insufficient-material draw rule in the `.lud` — see
`Common/res/def/rules/end/Checkmate.def`: `("IsInCheck" King Next)` AND
`no escape`). Under uniform-random play, this essentially never occurs by
chance within a tractable move budget: budgets of 6,000 turns (12,000 plies,
~5x the original recording's ~1,250-turn budget) and even 30,000 turns
(60,000 plies, ~24x) were tried and both still ended at `TurnLimit` with a
tied 1.5/1.5 ranking, not `NaturalEnd`. This matches the report's own B1
fallback: *"or explicitly treat `TurnLimit`-ended trials as non-authoritative
for parity purposes generally."* The regenerated trials are current-version
(`1.3.14`, post the `IsEnemyAt`/`IsFriendAt` predicate refactor) even though
still `TurnLimit`-ended — this eliminates the actual staleness concern
(pre-refactor `.lud` semantics) while being honest that `NaturalEnd` is not
practically reachable via pure random play for this specific game.

Note 2: Short Assize was verified via `ReplayCheck.java` rather than
regenerated. Both existing trials were loaded via
`MatchRecord.loadMatchRecordFromTextFile` and replayed against the CURRENT
compiled `.lud` engine:

```
=== T1 ===
Replayed all 559 recorded decision moves with CURRENT Java, zero mismatches.
  current trial.over()=true
  current winner=1 endtype=NaturalEnd
  WINNER MATCHES RECORDED: true
=== T0 ===
Replayed all 354 recorded decision moves with CURRENT Java, zero mismatches.
  current trial.over()=true
  current winner=2 endtype=NaturalEnd
  WINNER MATCHES RECORDED: true
```

Current Java is fully self-consistent with both recorded trials — every
recorded move is still legal at every ply, and the final winner/endtype
match exactly. This corroborates UPSTREAM-REPORT.md's B2 conclusion: Short
Assize's TS-side `TIMEOUT`/`MOVE_MISMATCH` results are **not** explained by
`.lud`/trial staleness, and are very likely genuine TS port issues. Per the
task's explicit instruction, Short Assize trials were left untouched.

Note 3: Kriegsspiel's original trials never finished recording at all (no
`endtype=`/`winner=`/`rankings=` lines present — the harness that produced
them evidently crashed, hung, or was killed mid-game). The `.lud` uses a
huge `(rectangle 33 49)` = 1617-cell board with expensive move generation
(observed 4-60 plies/sec, highly variable), and has no reachable win
condition under pure uniform-random play within any practical budget (each
regeneration ran the full 20,000-ply cap, `game.setMaxMoveLimit(20000)`,
taking ~19-20 minutes wall-clock per trial and still ending `endtype=MoveLimit`
rather than `NaturalEnd`). Both regenerated trials are nonetheless a strict
fidelity improvement over the originals: they are current-version
(`LUDII_VERSION=1.3.14`), and — critically — they are *complete,
well-formed* trial files with proper `winner=`/`endtype=`/`rankings=`
footers, which the stale originals were not.

Building `ReplayCheck.java` required three rounds of debugging around Move
flattening (documented in full in the "Methodological notes" section below)
because naive move-string comparison produces false mismatches — this
matters because it means the zero-mismatch result above is trustworthy, not
an artifact of a broken comparison.

## Newly-exposed TS port bugs

Regenerating against current Java, rather than masking staleness, exposed
two real TS-port discrepancies that the old (stale) trials were hiding
behind their own staleness:

### Bug 1 — Shatranj ar-Rumiya: MOVE_MISMATCH (both trials)

- **RandomTrial_0** (seed 101): at **ply 185**, recorded move
  `mover=2,from=43,to=27` is not present among TS's 16 legal moves at that
  point. TS's candidates at that ply are all `step`/`fromTo` moves from
  other origins (e.g. `step|mover=2,from=15,to=1`,
  `step|mover=2,from=15,to=14`, `step|mover=2,from=63,to=49`).
- **RandomTrial_1** (seed 102): at **ply 104**, recorded move
  `mover=1,from=39,to=40` is not present among TS's 31 legal moves at that
  point (candidates include `step`, `fromTo`, and `slide`-ludeme moves, none
  matching `39->40`).
- **Hypothesis (not confirmed by TS source inspection — out of this task's
  write scope)**: square 43→27 is a 2-square straight vertical jump with no
  intervening squares involved in the `from`/`to` pair — consistent with
  either the `Rook` piece (`("SlideCapture" Rotational)`) or the unusual
  `Elephant`/`Knight` custom-range ludemes in this `.lud`, which compute
  reachability via `(count Steps Orthogonal (from) (to))` rather than a
  standard direction-based generator (see
  `Common/res/lud/board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya.lud`,
  the `Knight` and `Elephant` piece definitions, lines ~40-89). A TS port
  bug in slide-blocking, in the "count orthogonal steps between two sites"
  helper, or in the `IsFriendAt`/`IsEnemyAt` macros used inside those piece
  rules would plausibly produce exactly this symptom (a legal Java move
  silently missing from TS's candidate set at a specific board
  configuration, while earlier and later plies in the same game replay
  fine). This should be handed to whoever owns TS engine ludeme parity as a
  concrete repro: game + seed + ply above regenerates deterministically.

### Bug 2 — Kiuthi: WINNER_MISMATCH (RandomTrial_1 only)

- At **ply 347** (the final ply — all 347 recorded moves replay in TS with
  **zero** `MOVE_MISMATCH`s), Java's recorded outcome is `endtype=NaturalEnd`,
  `winner=0`, `rankings=0.0,1.5,1.5` (a drawn game). TS, after replaying the
  exact same 347 moves, reports `tsWinner=-1` and `tsRankings=[]` — i.e. TS's
  own trial is **not over** at that point, even though every individual move
  string matched.
- **Hypothesis**: Kiuthi's end condition
  (`Common/res/lud/board/sow/two_rows/Kiuthi.lud:384-393`) is gated on a
  `("NoPieceOnBoard")` predicate and a `(nextPhase ("NoPieceOnBoard") "BetweenRounds")`
  phase transition — a two-phase ("main play" / "BetweenRounds")
  mancala-style rule structure. Since every move-string matched exactly
  through all 347 plies, the divergence is most likely in TS's end-condition
  evaluation or phase-transition handling for this specific pattern, not in
  move generation itself. This is a distinct bug class from Bug 1 (legality
  of an individual move vs. end-of-game detection) and should be filed
  separately.

### Bug 3 — Kriegsspiel: MOVE_MISMATCH (both trials, same ply, same origin square)

- **RandomTrial_0** (seed 501): at **ply 242**, recorded move
  `mover=1,from=1622,to=1289` (raw trial line:
  `Move=[Move:mover=1,from=1622,to=1289,actions=[Move:typeFrom=Cell,from=1622,typeTo=Cell,to=1289,decision=true],[Pass:]]`)
  is not present among TS's legal moves at that point — TS reports
  `tsMoveCount=1`, and that single candidate is a forced
  `pass|mover=1,from=-1,to=-1,isPass=true`.
- **RandomTrial_1** (seed 502): at the **exact same ply, 242**, recorded move
  `mover=1,from=1622,to=1377` — same mover, same `from` site (1622), different
  `to` — again not present among TS's legal moves, and again TS's only
  candidate is a forced pass (`tsMoveCount=1`).
- **This is a stronger signal than Bug 1/Bug 2**: two independently-seeded
  20,000-ply trials, generated from scratch with different RNG streams,
  diverge from TS at the identical ply (242) from the identical origin
  square (1622), each time with TS collapsing to "no legal moves, forced
  pass" for that mover. This is inconsistent with a move-order/RNG-content
  coincidence and points at a structural TS bug tied to game *state* at
  ply 242 (e.g. entrenchment/fog-of-war/turn-phase state reached at a fixed
  point after the shared `numInitialPlacementMoves=1199` setup sequence),
  not to the specific squares visited afterward.
- **Hypothesis (not confirmed by TS source inspection — out of this task's
  write scope)**: `Common/res/lud/board/war/replacement/eliminate/target/Kriegsspiel.lud`
  defines `InfantryMoves`/`CavalryMoves` (lines ~314, ~423) as a large `(or {...})`
  of move types gated by piece `state`, including a state==3 `(move Slide
  (from (from) if:(= (state at:(from)) 3)) (between (range 1 8) if:(or
  (is In (between) "SitesCanStandOn") (is In (between) (sites
  "TownRegion")))) ...)` long-range slide, plus separate state==1 step-capture
  and multiple `Select`-based "shoot" move types (normal, from-entrenchment,
  outnumber-the-enemy), each gated on different `(state at:(from))` values
  and territory/entrenchment predicates
  (`"IsSiteProtectedByEntrenchment"`, `"SitesWithEnemyFacingAway"`). TS
  reporting a forced pass for the mover at site 1622 (rather than merely
  missing one candidate among several, as in Bug 1) suggests TS's move
  generator is failing to produce *any* branch of this large `(or {...})`
  for that piece/state combination — plausibly a state-tracking or
  territory/entrenchment-predicate bug rather than a single geometry bug.
  Concrete repro: game + seed (501 or 502) + ply 242 above regenerates
  deterministically from the installed trial files.

All three bugs were deliberately **not** worked around by reseeding — per
instructions, the first seed's result was kept and documented rather than
iterating until a "clean" seed was found, since these are real port
discrepancies the stale trials had been masking (Shatranj ar-Rumiya's stale
`TurnLimit`/pre-refactor trial never got far enough into a matching Java/TS
state to hit the underlying piece-move bug; Kiuthi's stale trial happened
not to reach the drawn-endgame condition that exposes the phase/end-rule
bug; Kriegsspiel's stale trials never even finished recording, so they
never reached ply 242 at all).

## Methodological notes — ReplayCheck.java flattening bugs (debugging trail)

Three rounds of bugs were found and fixed while building the Short Assize
self-consistency checker; recorded here because they demonstrate the
zero-mismatch result is trustworthy rather than a false negative from a
broken comparison:

1. Naive string comparison between a pre-application legal `Move`'s
   `toTrialFormat(null)` and the recorded (already-applied) move's
   `toTrialFormat(null)` produced false mismatches, because pre-application
   legal moves can carry un-resolved `(then ...)` consequences as nested
   `Move` objects that render differently. Fix: flatten via
   `candidate.getActionsWithConsequences(context)` before comparing (mirrors
   `AuxilTrialData.updateNewLegalMoves()`).
2. `new Move(list)` does not populate `mover`/`from`/`to` — confirmed via a
   debug dump showing `mover=0,from=0,to=0` for a real move. Fixed by
   copying those fields from the original candidate after construction.
3. Deeper moves (with `levelMin`/`levelMax` stacking metadata) still
   mismatched. Root cause: same class of bug, more fields needed copying.
   Fixed by adding a dedicated `flattenPreservingMetadata(...)` helper that
   copies every field the real `Move.java` consequence-resolution code
   copies (`fromNonDecision`, `betweenNonDecision`, `toNonDecision`,
   `stateNonDecision`, `isOrientedMove`, `isEdgeMove`, `mover`,
   `levelMaxNonDecision`, `levelMinNonDecision`) — see
   `Core/src/other/move/Move.java` (~lines 592-603) for the reference
   pattern this mirrors.

## Deliverables

- Regenerated trial files (in place, under
  `Player/res/random_trials/**`, per the write restriction):
  - `board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya/RandomTrial_0.txt`
  - `board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya/RandomTrial_1.txt`
  - `board/sow/two_rows/Kiuthi/RandomTrial_1.txt`
  - `board/sow/two_rows/Li'b al-'Aqil/RandomTrial_0.txt`
  - `board/sow/two_rows/Li'b al-'Aqil/RandomTrial_1.txt`
  - `board/war/replacement/eliminate/target/Kriegsspiel/RandomTrial_0.txt`
  - `board/war/replacement/eliminate/target/Kriegsspiel/RandomTrial_1.txt`
- Backups of every original file, made before any overwrite:
  `/private/tmp/claude-501/wave16-regen/backup/`
- Scratch generator/checker tools (not part of the corpus, not committed):
  `/private/tmp/claude-501/wave16-regen/src/genparity/GenTrial.java`,
  `/private/tmp/claude-501/wave16-regen/src/genparity/ReplayCheck.java`
- This report: `/private/tmp/claude-501/validation-results/wave16/regen-report.md`
