# Ludii Java↔TypeScript Parity Campaign — Upstream Round-Trip Report

Scope: this is the campaign's final "upstream round-trip" deliverable
(Task #42). It lists (A) genuine bugs in the **original Java engine** that
the TypeScript port has deliberately reproduced bug-for-bug rather than
silently fixed, and (B) recorded random trials in `Player/res/random_trials/`
that are stale or otherwise unsuitable as ground truth and should be
regenerated upstream. Every TS bug-compatible code path cited below carries
its own `@java <file>:<line>` and/or `oracle`-tagged comment in source, so
`grep -rn "@java\|oracle"` over the listed TS files reproduces this
catalogue mechanically. All TS citations below were verified directly
against the committed, tracked repository at
`/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine/src/`
(`git status`/`git diff HEAD` clean on every file cited — nothing is an
uncommitted or scratch-only artifact). Java paths are relative to
`Core/src/...` unless stated otherwise. Current tracked Java version:
`1.3.14` (`Common/src/main/Constants.java:14`).

---

## Section A — Genuine Java bugs the port reproduces faithfully

### A1. `ActionAdd`: `updateTrackIndices` double-fires for stacking-game Adds

**Java:** `other/action/move/ActionAdd.java`. `apply()` calls
`applyStack(context, cs)` unconditionally whenever `requiresStack` is true
(line 200: `final boolean requiresStack = game.isStacking();`; lines
284-285: `if (requiresStack) applyStack(context, cs);`), then **falls
through**, unconditionally, into the same method's shared tail, which ends
with a second call to `updateTrackIndices(context)` at line 313.
`applyStack()` (lines 324-349) itself already ends with its own
`updateTrackIndices(context)` call at line 348. A stacking-game `Add`
therefore genuinely calls `updateTrackIndices` **twice** for the same
placement, once from each call site. This is a real double count, not a
redundant no-op: `OnTrackIndices.add(trackIdx, what, count, index)`
(`other/state/track/OnTrackIndices.java:166-170`) is a true `+= count`
accumulator.

**TS:** `action/action-add.ts:197-205`, two literal sequential calls with
an inline citation:

```ts
// @java ActionAdd.java:348 (applyStack) + :313 (apply, fall-through) —
// a stacking-game Add genuinely calls updateTrackIndices TWICE (once
// per call site). OnTrackIndices.add is a true `+= count` increment
// (Core/src/other/state/track/OnTrackIndices.java:166-170), so this
// double call really does double the ring-index tally for stacking
// games — matching the double-count already replicated for initial
// placement in on-track-indices.ts's buildInitialOnTrackIndices.
next = updateTrackIndices(next, this.whatIndex, this.countValue, this.toIndex);
next = updateTrackIndices(next, this.whatIndex, this.countValue, this.toIndex);
```

**Campaign evidence:** landed as part of the wave-14 Mini Wars fix
(`validation-results/wave14/mini-wars.md`, `wave14/mini-wars.diff`), which
preserved this double-fire deliberately while fixing three unrelated
`value`/`rotation`-write gaps in the same file:
- `board/war/replacement/eliminate/target/Mini Wars` — before: 2/2
  `MOVE_MISMATCH` (ply 37, ply 60). After: 2/2 `OUTCOME_OK`.
- `board/war/replacement/eliminate/target` (26 trials): 22 `OUTCOME_OK`, 2
  pre-existing `MOVE_MISMATCH` (Rithmomachia, unrelated), 2 pre-existing
  `REPLAY_OK_NO_OUTCOME` (Kriegsspiel — see §B5). Zero regressions.
- `board/war/replacement/eliminate` (154 trials): 146 `OUTCOME_OK`, 6
  pre-existing `MOVE_MISMATCH` (Boolik ×2 — see A2, Triple Tangle ×2,
  Rithmomachia ×2), 2 pre-existing `REPLAY_OK_NO_OUTCOME` (Kriegsspiel).
  Zero regressions.

**Upstream fix:** guard the tail-of-`apply()` `updateTrackIndices` call so
it does not re-fire when `applyStack()` already ran it; re-record any trial
for a duplicate-track-site stacking game; drop the second TS call once
fixed and re-verified.

---

### A2. `ContainerGraphStateStacks`'s level-based remove leaves `state` dirty in reused stack slots (Boolik)

**Java:** `other/state/container/ContainerGraphStateStacks.java:1003-1044`
(the level-based `remove(State, int site, int level, int type)` overload,
reached via `ActionMoveLevelFrom.java:449` / `:444-457`) shifts every level
above the removed one down by one but only relocates the `who[]`/`what[]`
per-level arrays — it never relocates/clears the parallel `state[]` array
for that slot. Contrast the level-*less* remove-all overload at `:969-1000`,
which correctly clears all three parallel arrays. So a level-based remove
leaves a stale `state` value sitting in a chunk slot that a later,
unrelated, **state-less** `addItemGeneric` call (the hand-entry path used
by `ActionMoveTopPiece.java:485-498`, and `ActionAdd`) will reuse without
ever writing `state` itself — resurrecting the stale value from the earlier
occupant. `ActionSetState.java:107-121` is the only other place that would
normally clear this residual.

**TS:** `state.ts`'s `residualStateAt` shadow channel (field declared
`state.ts:127,386-387`, initialized `:635`; consumed via
`residualStateAtLevel` in `action/action-move.ts:974,996,1523,1544`),
`action/action-set-state.ts` (clears the stash, mirroring
`ActionSetState.java:107-121`). Dispatch parity for `level:` syntax
confirmed against `FromTo.java:328-340` (`level:` present ⇒
`ActionMoveLevelFrom`).

**Campaign evidence:** full root-cause writeup at
`validation-results/boolik-final.md` (189 lines) + `boolik.diff`. Validated
on `board/war/replacement/eliminate/all/Boolik` (ply 52/53 `MOVE_MISMATCH`
fixed on both trials) and a 128-trial `eliminate/all`-family regression
sweep: 112/128 `OUTCOME_OK` unchanged before/after, byte-identical failing
set — zero regressions.

*(Note: a separate, unrelated **TS-only** bug in the same game family —
`action-move.ts:780`'s occupancy check reading `state.who(toIndex) > 0`
instead of `state.whatAtSite(toIndex) !== 0`, wrongly treating a
Neutral-owned piece as an empty site (Chukaray) — is documented in
`validation-results/chukaray-final.md`. Java's own
`ActionMoveTopPiece.java:484-516` stacking branch is correct/unconditional
there, so this is a TS port bug, not a Java bug the port reproduces, and is
intentionally excluded from this section.)*

**Upstream fix:** make `ContainerGraphStateStacks.java:1003-1044`'s
level-based remove clear the `state` channel of the popped slot, matching
its level-less sibling at `:969-1000`. Re-record trials for any stacking
game using `(remove (site) level:(level))`-style FROM clauses that later
reuse the same chunk slot via a state-less write path. Drop the
`residualStateAt` shadow channel in TS once fixed and re-verified.

---

### A3. `Graph.findOrAddFace` / `Edge` — exactly two face slots, unconditional silent eviction

**Java:** `game/util/graph/Edge.java:26-27`
(`private Face left = null; private Face right = null;`) — an `Edge` can
only ever record its two immediately-adjacent faces. `setLeft()` (`:111-114`)
and `setRight()` (`:129-132`) both unconditionally overwrite whatever was
previously stored, with no "already claimed" guard, so a third face
claiming an edge silently evicts one of the first two with no error.
`Graph.findOrAddFace(int... vertIds)` (`:1167-1234`) dispatches every
newly-created face into one of the two slots via exactly this unconditional
overwrite (`:1228-1231`):

```java
if (edge.vertexA().id() == vert.id()) edge.setRight(newFace); else edge.setLeft(newFace);
```

**TS:** `eval/graph/trajectory/graph-element.ts`'s `EdgeEl` class
(`left`/`right` single-value fields, replacing an earlier incorrect
unbounded `faces: FaceEl[]` array) — `claim(face, fromVertexId)`
(`:114-...`, called at `:252`) mirrors the Java dispatch verbatim. Full diff
at `validation-results/shut-off-his-lights.diff`, which documents the
observable Java behavior directly: on a `celtic(4)` board, boundary cell
7's edges to cells 3/4 report one-sided (`otherFace == null`) even though
those cells geometrically touch cell 7 at that edge — confirming this
"last claimant wins, eviction is silent" quirk is authoritative reference
behavior, not something to smooth over.

Note: `validation-results/wave10/celticator.md` and
`validation-results/wave11/celticator2.md` document two **different**,
already-fixed TS-only bugs on the same board generator (a missing
`measurePerimeter()` recompute after the rounded-corner pass; a stale
`flatOwned` position cache; and a face-creation-order/`seq`-field gap
affecting `Face.stepsTo`'s diagonal tie-break) — not this bug, and should
not be conflated with it.

**Campaign evidence:** `board/space/blocking/Shut Off His Lights` — current
baseline (`parity-scratch/baselines/after_wave14/`): `OUTCOME_OK` ×2,
confirming the two-slot model is both necessary and sufficient.

**Upstream fix:** this is a fundamental representational limit of Java's
`Edge` class (planar graphs only, by design) rather than an accidental bug
in the usual sense — worth flagging upstream as a documented limitation so
any future non-planar board generator doesn't rely on `Edge` recording more
than two faces. No trial re-recording needed; TS already faithfully matches
Java's planar-only behavior.

---

### A4. Investigated, **not substantiated**: `EvalContext.to()`=OFF / "Kotu" / numPlayers size-vs-count

The task brief's known list included: "`EvalContext (to)=OFF` dead code
(Kotu); `numPlayers` size-vs-count discrepancy." Investigated directly:

- `other/context/EvalContext.java` is a plain 15-field getter/setter data
  holder (`from`, `level`, `to`, `between`, `pipCount`, `player`, `track`,
  `site`, `value`, `region`, `hintRegion`, `hint`, `edge`, `team`), every
  scalar defaulting to `Constants.OFF` (`to` at `:26`, getter at `:141`) —
  this default is real, but there is no branching logic or dead-code path
  in the file, and no campaign validation `.md` ties this default to any
  concrete game/ply/observed divergence.
- `grep -r "Kotu" validation-results/` (excluding scratch build trees)
  returns zero matches beyond the unrelated real game names `Kotu Ere`/
  `Kotu Kotu` (both currently `OUTCOME_OK`).
- `grep -r "size-vs-count"` / "numPlayers" hits all trace to a different,
  already-fixed, TS-only bug (a missing `numPlayers` field on a synthetic
  eval context used for `Shared`-role resolution), unconnected to
  `EvalContext.to()`.

**No fabricated finding is reported here.** This candidate should be
dropped from the upstream catalogue unless further oracle work turns up a
concrete repro tied to a specific game and ply.

---

### A5. Fenix oracle-investigation cluster — four confirmed genuine Java bugs, one unsubstantiated, one ruled out

`validation-results/wave12/scratch/verify/engine/PROJECT_COMPLETION.md`
contains a dedicated catalogue — `## Update 190 — UPSTREAM JAVA BUG
CATALOGUE (user directive; Task #42)`, line 2280 — compiled from an
extensive `jshell`/`javap` oracle investigation of
`board/war/leaping/orthogonal/Fenix` (Updates 156-201). All items below
trace to that investigation; every Java citation and every TS bug-compat
site was independently re-verified for this report directly against
`Core/src/` and the real committed
`typescript/packages/engine/src/` tree (not a scratch copy).

**A5a. `FullOwned.remove` — type-confused bounds check strands stale ghost entries (CLEAR BUG, shipped).**
`other/state/owned/FullOwned.java:220-256`. `remove()` first strips the
removed piece's own `FullLocation` entries (lines 222-236, into local
`locs`), then walks every player/component's location list decrementing
the level of any entry above the removed level (lines 238-254). The
decrement guard at **line 248** is:

```java
if (sitePos == pieceLoc && levelPos > level
        && (type == null || i >= locs.size() || locations[idPlayer][i].get(idPos).siteType().equals(type)))
```

`i` here is the **component-index loop variable for the current
`idPlayer`** (outer loop at line 240) — but `locs` is the *original*
removed piece's own component-location list from line 222, an entirely
unrelated list. `i >= locs.size()` compares a component index against an
unrelated list's element count, a type-confused bounds check with no
logical connection to whether the decrement should fire; when it spuriously
evaluates true the type-match condition is skipped entirely (short-circuits
to "always decrement"). Net effect: `Owned` position entries for *other*
pieces at the same site can retain a stale level after a piece above them
is removed — a registry ghost that still generates legal moves for a
component no longer actually present at that level. Oracle: on Fenix, ghost
born at replica ply 16 (trial 0) / ply 38 (trial 1); drives the actually
recorded moves at ply 78 (trial 0) / ply 55 (trial 1).

**TS (verified shipped, committed, not a scratch artifact):**
`state.ts:1652-1670` (`withOwnedRemoveLevel`):

```ts
/**
 * @java FullOwned.remove(pid, comp, site, LEVEL, type) — FullOwned.java:
 * 220-256: delete entries of (pid, comp) matching (site, level), then
 * DECREMENT the level of EVERY entry (all players/components) at the same
 * site with level > removed. The decrement-after-clamp interplay is what
 * leaves Java's stale ghosts; port verbatim.
 */
public withOwnedRemoveLevel(pid: number, comp: number, site: number, level: number): State { ... }
```

**A5b. `Move.java` flush order — checked-in source reads descending, the running JVM behaves ascending (CLEAR, confirmed via `javap`; shipped).**
`other/move/Move.java:544-575` (stacking branch), as written in
`Core/src`, applies queued level-removes **descending**. Perturbing a
`jshell` replica against the actual running/compiled binary (`javap`) shows
the executing code applies them **ascending** — confirmed by the specific
ghost signature observed (`s25 [2,2]->[]`, board fully cleared, while the
P2-owned `L0` entry survives — reproducible only under ascending
application). This is a genuine source-vs-compiled-binary divergence:
either the checked-in `Core/src` is stale relative to what was actually
built into the Ludii release these trials were recorded against, or an
intermediate patch changed the ordering without updating source.

**TS (verified shipped):** `ludemes/Game.ts:1361-1370`:

```ts
// ORACLE-EMPIRICAL (Update 169): the RUNNING binary applies the
// level removes ASCENDING (ghost signature: board [2,2]->[] with
// owned L0 surviving); Core/src reads descending — trust javap/
// observables over source.
```

**A5c. `MaxMoves` value-read asymmetry — outer `eval()` reads per-level value (3-arg), the `getReplayCount` recursion reads top-of-stack value (2-arg) (SUSPECT, oracle-confirmed; shipped).**
`game/rules/play/moves/nonDecision/effect/requirement/max/moves/
MaxMoves.java` — the outer `eval()` sums each candidate's captured value via
a per-level container read, `getReplayCount()`'s own recursion sums
captured value via the two-argument top-of-stack read. For a stacked victim
whose top level was pushed valueless (A5d), the recursion undercounts
relative to the outer eval. Oracle-confirmed to be exactly what ranks
Fenix's `47>65` hop-chain above `47>29` in the real engine: a `jshell`
replica was perturbed until it reproduced Java's actual legal-move set
(`{47>65}` only), then `javap`'d against the running `MaxMoves.class` to
settle the arity discrepancy empirically.

**TS (verified shipped):**
`ludemes/game/rules/play/moves/nonDecision/effect/requirement/max/moves/
MaxMoves.ts:88-95` (outer, `valueAtLevel`) —

```ts
// @java MaxMoves.java:91-104 — the OUTER eval sums the PER-LEVEL
// value cs.value(site, LEVEL, type); NonApplied removes carry
// levelTo=0 (oracle javap + action dump).
```

— vs. `:154-162` (recursion, `valueTop`) —

```ts
// @java getReplayCount (RUNNING BINARY, javap-verified) — the
// RECURSION reads the TWO-ARG cs.value(site, type) = TOP-of-stack
// value; a stacked victim whose top was pushed valueless scores 0
// here. This asymmetry vs the outer per-level read is what ranks
// Fenix's 47>65 chain (6) above 47>29 (4) — replica-confirmed.
```

**A5d. Plain stacking-push drops the mover's piece VALUE — new top level always reads 0 (SUSPECT, verified against source; shipped).**
`other/action/move/move/ActionMoveTopPiece.java:484-498` — the stacking
branch's plain-push path calls the 5-argument overload
`csTo.addItemGeneric(context.state(), to, what, who, context.game(),
typeTo)` at line 498, which has no `value` parameter — unlike the pop/
restore paths in the same class (`:606`, `:628`) that explicitly forward
`previousValueFrom[lvl]`/`previousValueTo[lvl]`. So a plain single-piece
stacking push never carries the moving piece's value onto the new top
level; it reads `0` regardless of the piece's prior value. Oracle: Fenix
general at site 28, `s28=[1,0]` (bottom level retains its original value 1;
the newly-pushed top level is 0).

**TS (verified shipped):** `action/action-move.ts:1161-1164`:

```ts
s2 = s2.withStackPush(this.toIndex, mOwner, mWhat);
// @java addItemGeneric — the plain push does NOT carry the mover's
// value; the new top level reads 0 (oracle: Fenix s28=[1,0]).
s2 = s2.withValueStackRow(this.toIndex, [...toBaseV, 0]);
```

**A5e. `MeasureGraph` label-error accumulator — flagged, not substantiated.**
The catalogue's item 5 ("MINOR — MeasureGraph label error accumulator
overwritten not accumulated") was checked directly against
`game/util/graph/MeasureGraph.java:1214-1359` and the TS port
(`ludemes/game/util/graph/MeasureGraph.ts:1132-1240`): both use a
straightforward "keep the lower of two candidate errors" (`=`, not `+=`)
best-of-two-axis selection, which is the intended behavior, not an
accumulator bug — and a separate accumulator in the same file
(`error += acc / bkt.items().length`, ported identically) genuinely does
accumulate. No TS bug-compat comment or oracle evidence ties this catalogue
line to any observed game/ply divergence. Reported here for completeness
per the task brief's "any others flagged genuine/accident" instruction, but
should **not** be carried into an upstream issue without further evidence.

**A5f. Candidate #6 (Terhuchu `SiteFinder` silent coordinate skip) — investigated and ruled out, not a Java bug.**
Update 200 (`PROJECT_COMPLETION.md:2325-2328`) flagged as suspicious that
Java's placement-coordinate resolution silently skips an unmatched label
("L6" on the Terhuchu board) rather than erroring. Update 201
(`PROJECT_COMPLETION.md:2330-2333`) resolved this: the coordinate is
legitimately absent from Java's own label map (row 6 only holds columns
F/H/I/J/L on that board; `G6` genuinely does not exist), so Java's silent
skip is *correct* board topology, not a bug. The actual observed divergence
was on the TS side — the ported label-clustering algorithm produced a
different, incorrect column assignment and fabricated a phantom placement.
Included only to close out the task brief's "elaborate on any candidates"
instruction — this is **not** a genuine Java bug and should not be carried
into an upstream issue.

---

## Section B — Stale recorded trials needing regeneration upstream

Current buckets below are read from
`/private/tmp/claude-501/parity-scratch/baselines/after_wave14/
replay-results-shard*of24.json` (24 shards, latest full-corpus baseline).
None of these represent TS engine bugs in the confirmed sense of Section A;
each is either (a) recorded against an older `.lud`/harness state than
current, (b) recorded with `endtype=TurnLimit` — i.e. the harness's move
budget ran out before Java itself reached a natural conclusion, making even
Java's own recorded "winner" an arbitrary tie-break rather than a real
result, or (c) a trial that never reached any concluded game state in Java
at all.

| Game | Trial | Current bucket | `LUDII_VERSION` | `endtype` (recorded) |
|---|---|---|---|---|
| Shatranj ar-Rumiya | T0 | `MOVE_MISMATCH` (ply 180) | 1.3.0 | `TurnLimit`, tied 1.5/1.5 |
| Shatranj ar-Rumiya | T1 | `MOVE_MISMATCH` (ply 241) | 1.3.0 | `TurnLimit`, tied 1.5/1.5 |
| Short Assize | T0 | `TIMEOUT` (ply 155) | 1.3.4 | `NaturalEnd`, winner=2 |
| Short Assize | T1 | `MOVE_MISMATCH` (ply 87) | 1.3.4 | `NaturalEnd`, winner=1 |
| Kiuthi | T0 | `OUTCOME_OK` | 1.2.10 | `NaturalEnd` (already green) |
| Kiuthi | T1 | `WINNER_MISMATCH` | 1.2.10 | `NaturalEnd`, tied 1.5/1.5 |
| Li'b al-'Aqil | T0 | `WINNER_MISMATCH` | 1.3.0 | `TurnLimit`, tied 1.5/1.5 |
| Li'b al-'Aqil | T1 | `WINNER_MISMATCH` | 1.3.0 | `TurnLimit`, tied 1.5/1.5 |
| Kriegsspiel | T0 | `REPLAY_OK_NO_OUTCOME` | 1.3.0 | *(missing entirely)* |
| Kriegsspiel | T1 | `REPLAY_OK_NO_OUTCOME` | 1.3.0 | *(missing entirely)* |
| Dice Shogi | T0/T1 | `OUTCOME_OK` / `OUTCOME_OK` | — | **RESOLVED** |
| Battleships | T0/T1 | `OUTCOME_OK` / `OUTCOME_OK` | — | **RESOLVED** |

Current source version: `Common/src/main/Constants.java:14`,
`LUDEME_VERSION = "1.3.14"`.

### B1. Shatranj ar-Rumiya (both trials) — stale, weak ground truth

Recorded `LUDII_VERSION=1.3.0` (884d6aedcf, 2021-11-15), `winner=0`,
`endtype=TurnLimit`, `rankings=0.0,1.5,1.5`. A `TurnLimit` end with a tied
1.5/1.5 ranking means the recorded game simply ran out of the recording
harness's move budget rather than reaching Java's own terminal condition —
even Java's own recorded "winner" here is a non-decisive tie-break, not a
real result. On top of that weak ground truth, the `.lud` has had 45
touching commits since 1.3.0, including a real predicate refactor (commit
`486c0bca2b`, "Many games using `IsEnemyAt`/`IsFriendAt`", 2022-07-07,
replacing five inline `(is Enemy (who at:(to)))`/`(is Friend ...)`
expressions in this exact file with macro calls — behavior-preserving in
isolation, but confirms the file has seen substantive edits, not just
metadata bumps). **Recommendation:** regenerate both trials against current
Ludii with a move budget sufficient to reach `NaturalEnd` (or explicitly
treat `TurnLimit`-ended trials as non-authoritative for parity purposes
generally — see B4, same pattern).

### B2. Short Assize — inconclusive; do not regenerate as a first step

Recorded `LUDII_VERSION=1.3.4` (61108a699f, 2022-07-15). Unlike B1/B4, both
trials have **decisive** `NaturalEnd` results (T0 `winner=2,
rankings=0.0,2.0,1.0`; T1 `winner=1, rankings=0.0,1.0,2.0`) — these are
real, non-arbitrary ground truth. The only `.lud` change since recording is
commit `f0a02038cb` ("TwoPlayersNorthSouth ludemeplex added and used in 180
games", 2022-07-21, six days after recording), which replaced the literal
`(players {(player N) (player S)})` declaration with the
`("TwoPlayersNorthSouth")` ludemeplex — a cosmetic authoring-convenience
substitution with no semantic difference (the ludemeplex expands to the
same player list); the checkmate end-rule itself
(`.lud:32,126-129`, `(not (can Move (do (forEach Piece Next)
ifAfterwards:(not ("IsInCheck" "King" Next)))))`) is unchanged and was
independently spot-checked as correctly ported. So this pair is **not**
well-explained by `.lud` staleness.

A specific alternative hypothesis was checked and ruled out:
`wave14/wave14b-open.md` documents a genuine, currently-unfixed TS gap
where `FromTo.ts` never wires `(move ... (to <site> level:(N)))`
destination-level placements to `ActionMoveLevelTo`
(`ActionMoveLevelTo.java:455`), and a census of `level:`-using `.lud` files
flagged Short Assize as a possible instance. Reading `Short Assize.lud`
directly shows all 9 of its `level:` usages are on the `from`/`remove` side
inside `forEach Level` loops for the shared Queen+Pawn setup square — none
are the destination-level pattern that gap affects — so Short Assize is
very likely a false positive for *that specific* bug. However,
`validation-results/wave12/pahada3.md:198-204` (a 138-trial regression
sweep over all 69 `level:`-using games) lists Short Assize among 16
pre-existing `MOVE_MISMATCH` games grouped alongside Ringo, Chonpa, Yucebao,
Rithmomachia, Boolik, Sahkku, and Puluc — several of which are targets of
other, still-open level/stacking-mechanism investigations in this campaign.
It remains plausible Short Assize's `MOVE_MISMATCH` shares an unresolved TS
root cause with one of those games rather than being simple trial
staleness. Separately, T0's `TIMEOUT` is attributed (per an in-progress,
unlanded campaign performance investigation) to `state.ts`'s
`fillStacks`/`fillWhatStacks`/`fillHidden` unconditionally deep-copying full
per-site arrays on every `State.with()` call — a TS performance issue,
unrelated to trial staleness or Java correctness.

**Recommendation:** do not regenerate Short Assize as a first step — the
`.lud` rules are effectively unchanged since recording, so regeneration
alone would not resolve a genuine TS bug if one exists here. Treat as a
follow-up once the Ringo/Rithmomachia/Chonpa/Yucebao level-mechanism family
is resolved; only regenerate if that investigation concludes Short Assize's
specific setup-square `level:` usage is itself unsupported by current
semantics.

### B3. Kiuthi — stale (T1; T0 already green), oldest version gap in this report

Recorded `LUDII_VERSION=1.2.10` (commit window `27e5528605`→`a4431a9cab`,
2021-09-20 to 2021-10-06) — 4 minor versions behind current 1.3.14, the
oldest gap of any game in this report. Both trials recorded a genuine
`NaturalEnd` (not a `TurnLimit` artifact), though tied `rankings=0.0,1.5,
1.5`. `.lud` git history: commit `3af2698c5c` ("all 2 rows mancala until
Tapata (included) shorter and improved", 2022-07-11) rewrote this file's
core macros — replacing the inline `"NextHole"` definition
(`(trackSite Move from:#1 #2 steps:#3)`) with a call to a shared
`"NextSiteOnTrack"` macro and removing the now-unused `"OppositePit"`
definition — a structural macro-layer change, not pure formatting; 34
total commits touch this file since 2021-09-22. T1's `WINNER_MISMATCH` has
been confirmed byte-identical/unaffected across multiple independent,
unrelated wave10-wave12 TS regression sweeps (`wave12/khutka-boia.md`'s
426-trial `board/sow` sweep, `wave10/01-bao.md`), strong corroboration this
is a stable, stale artifact rather than a live TS regression target.
**Recommendation:** regenerate T1 against current Ludii.

### B4. Li'b al-'Aqil (both trials) — stale, weak ground truth

Recorded `LUDII_VERSION=1.3.0` (884d6aedcf, 2021-11-15), `winner=0`,
`endtype=TurnLimit`, `rankings=0.0,1.5,1.5` — same weak-ground-truth
pattern as B1 (tied ranking from running out of the recording harness's
move budget, not a real terminal state). `.lud` git history: commit
`3c37c1b873` ("130 more games using `SameTurn` ludemeplex", 2022-07-11)
replaced this file's inline relay-continuation condition `(and (not (is
Pending)) (is Mover Prev))` with `(and (not (is Pending)) ("SameTurn"))` —
a semantic macro substitution in the exact `Select`/relay gate that governs
turn continuation, precisely the kind of change that could flip a
long-game `WINNER_MISMATCH` (both trials' failures are `WINNER_MISMATCH`,
consistent with a turn-continuation-timing divergence rather than a single
illegal move). 37 total commits touch this file since 2021-07-29. Both
trials' failures confirmed pre-existing/unaffected across the same
regression sweeps cited for Kiuthi (B3). **Recommendation:** regenerate
both trials against current Ludii with a move budget sufficient to reach
`NaturalEnd`.

### B5. Kriegsspiel (both trials) — never completed in Java, not a port bug

Full analysis: `validation-results/wave11/kriegsspiel.md`. Both trial files
are byte-identical (same RNG seed); of 1201 `Move=` lines, 1199 are
`mover=0` hidden-setup/entrenchment placements, and only **2** real player
decisions are recorded — immediately followed by raw Java debug output that
leaked into the trial file (`LEGAL MOVES LIST SIZE = 7060` / `= 7140`)
instead of further played moves. Neither file has a `winner=`, `endtype=`,
or `numInitialPlacementMoves=` footer — only a zeroed `rankings=0.0,0.0,
0.0` and `LUDII_VERSION=1.3.0`. A corpus-wide scan of every `.txt` under
`Player/res/random_trials/` (several thousand files) confirmed these are
the **only two** files missing `winner=`/`endtype=` in the entire corpus —
anomalous, not a benign format variant. The end condition itself
(`Kriegsspiel.lud:995-998`, `(is In 1323/293 ...)`) was independently
verified correct in both engines via cross-check against the structurally
similar `experimental/Havabu.lud` (`OUTCOME_OK` 2/2). The harness's
`REPLAY_OK_NO_OUTCOME` bucket (`test/parity/replay-trials.mjs:1453-1455`)
fires correctly here — there is no recorded ground truth to compare
against, independent of whatever TS's own `game.over()` returns. Most
likely explanation: Java's own trial-recording process stalled or was
killed mid-flight on Kriegsspiel's combinatorial move-generation explosion
(7000+ legal moves at plies 1-2, from the `TinSoldier`/`Bishop`/
`RegimentalOutline`/`CannonOutline` unit × rotation/entrenchment
cross-product) before a decision was ever recorded. **Recommendation:**
re-record both trials with a substantially larger move-generation/timeout
budget (Kriegsspiel's 7000+-way early branching is itself likely worth
upstream attention independent of this report). No TS engine change is
applicable — making TS declare a winner here would be unfaithful, since
Java's own copy of the game never reaches one either.

### B6. Dice Shogi and Battleships — RESOLVED, no longer stale

Current baseline: Dice Shogi both trials `OUTCOME_OK`; Battleships both
trials `OUTCOME_OK`. Both were previously flagged (Dice Shogi as a
1.3.0-era partial state; Battleships T1) but are fully green as of the
`after_wave14` baseline. **Recommendation:** no action needed; remove both
from any upstream regeneration queue unless a future regression
reintroduces a mismatch.

---

## Summary

| # | Item | Disposition |
|---|---|---|
| A1 | `ActionAdd` double `updateTrackIndices` | Confirmed, shipped |
| A2 | `ContainerGraphStateStacks` level-remove state leak (Boolik) | Confirmed, shipped |
| A3 | `Graph.findOrAddFace` two-slot silent eviction | Confirmed, shipped |
| A4 | `EvalContext.to()`=OFF / Kotu | Investigated, unsubstantiated |
| A5a | `FullOwned.remove` type-confused bounds check (Fenix ghosts) | Confirmed, shipped |
| A5b | `Move.java` flush order (source vs. binary, `javap`-verified) | Confirmed, shipped |
| A5c | `MaxMoves` value-read arity asymmetry | Confirmed, shipped |
| A5d | Stacking-push VALUE drop | Confirmed, shipped |
| A5e | `MeasureGraph` label-error accumulator | Investigated, unsubstantiated |
| A5f | Terhuchu `SiteFinder` silent skip (candidate #6) | Investigated, ruled out — not a Java bug |
| B1 | Shatranj ar-Rumiya ×2 | Stale (`TurnLimit` + version gap), regenerate |
| B2 | Short Assize T1 (+T0 inconclusive) | Do not regenerate yet — tie to open level-mechanism investigation |
| B3 | Kiuthi T1 (T0 already green) | Stale, regenerate |
| B4 | Li'b al-'Aqil ×2 | Stale (`TurnLimit` + version gap), regenerate |
| B5 | Kriegsspiel ×2 | Never completed in Java, re-record with larger budget |
| B6 | Dice Shogi | Already green |
| B6 | Battleships | Already green |
