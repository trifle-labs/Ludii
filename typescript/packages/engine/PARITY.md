# Java→TS parity system

This engine is a port of the Java **Ludii** general game system. The overriding
goal is **faithful, verifiable, maintainable parity**: an upstream Java change
should be traceable to the exact TS code that implements it, and "are we
correct?" should be a number we can regenerate, not a vibe.

To that end, parity is checked at four layers. Each is independently runnable.

| Layer | Question it answers | Artifact / runner | Needs Java build? |
|---|---|---|---|
| 0. Provenance | Where does this TS code come from in Java? | `// @java` tags → `tools/parity/gen-provenance.mjs` → `java-provenance.tsv` | no |
| 1. Feature coverage | Is every ludeme implemented? (breadth) | `tools/parity/scan-coverage.mjs` → `COVERAGE.md` | no |
| 2. Trial replay | Does each game *behave* like Java? (depth) | `test/parity/replay-trials.mjs` → `REPLAY-RESULTS.md` | no |
| 3. Golden fixtures | Does each function match bit-for-bit? | Java `EmitFixture` → `tools/parity/fixtures/*` ↔ TS runner | yes |

## The metric that matters: Layer 2

Layer 1 (feature coverage) is necessary but **deeply misleading on its own**.
Current numbers make the point:

```
Layer 1 feature coverage:  92.7%   (431 / 465 ludemes have a handler)
Layer 2 behavioral parity:  7.5%   (192 / 2558 Java trials reproduce the outcome)
```

A `case "slide":` existing does not mean Slide produces the moves Java produces.
**Layer 2 is the true-north metric.** It works by replaying Ludii's own
regression corpus — `Player/res/random_trials/**/*.txt`, 2 recorded trials per
game — through the TS engine: for each recorded move, assert a matching legal
move exists in TS, apply it, and compare the final winner/rankings.

Replay buckets (baseline, full corpus):

```
OUTCOME_OK            192   7.5%   replayed to the same winner
WINNER_MISMATCH       286  11.2%   ran to end, wrong winner
REPLAY_OK_NO_OUTCOME   20   0.8%   moves matched, no outcome API hit
MOVE_MISMATCH       1968  76.9%   TS lacked the recorded move  ← the work
START_FAIL             4   0.2%   start() threw (2× stack overflow in sow)
COMPILE_FAIL          88   3.4%   .lud didn't compile (mostly missing subgame files)
```

### What MOVE_MISMATCH is telling us

It is overwhelmingly **topology and direction infidelity**, not missing
features:

- chess-family `replacement` (585) — piece-movement topology / site numbering
- `space/line` Gomoku-family (412) — vertex-vs-cell site numbering
- `sow` mancala (356) — sowing semantics
- `race` backgammon-family (301) — dice values (RNG not seeded from the trial)
- `hunt` fox-and-geese / alquerque (126) — custom graph-board numbering

Root cause (confirmed by the trajectory audit): Java resolves **every** board —
square, hex, triangular, concentric — through one mechanism,
`topology.trajectories().steps(type, from, type, dir)` / `radials(...)`, with
`Adjacent`/`Orthogonal`/`Diagonal`/`All`/`OffDiagonal` as real `AbsoluteDirection`
values. The TS port instead grew **two** geometry systems (Cartesian `xOf/yOf/
siteAt` for square/hex/tri; graph `Trajectories` only for board-algebra boards)
and an 8-compass angle-binning shortcut that omits 44 of Java's 52 directions.
44 call sites assume Cartesian geometry.

## Roadmap to raise Layer 2 (ranked by mismatch volume)

1. **Trajectory unification** — *core done.* The faithful `TrajectoriesCore`
   (`src/eval/graph/trajectory/`) is a function-level port of Java's
   `Trajectories`/`Steps`/`Radials`/`Face.stepsTo`/`Vertex.stepsTo`, validated by
   `test/trajectory-core.test.ts` and now the single mechanism behind every
   graph-backed board (`trajectories.ts` is a thin facade over it). **Finding:
   square/rect boards are NOT rebased onto it** — for a square grid, traj
   compass/ortho/diagonal resolution is provably identical to the Cartesian
   lattice (north = +row = `site+width` either way), so attaching `traj` there
   buys zero move-generation difference while breaking the integer coordinate
   system (centroids land at `col+0.5`, defeating `siteAt`'s 0.25 tolerance and
   `C3`-style coordinate placement — measured: 30/493 unit tests regress). The
   integer lattice IS the faithful projection of the trajectory steps for
   squares; only genuinely non-lattice boards need `traj` for coordinates.
2. **Full `AbsoluteDirection` set** — *done.* All 51 Java values
   (`absolute-direction.ts`, ordinal-faithful) including 16-compass, rotational
   `CW/CCW/In/Out`, and 3D `U*/D*`, with `specific()` parity.
3. **RNG parity (SplitMix64)** — *core done, blocked downstream.* `split-mix64.ts`
   is a verified port (14 tests vs Java bytecode); the replay harness seeds it
   from each trial's 8-byte state. Dice/race numbers are unchanged because the
   real blocker is `compileDo` not implementing the `next:` arm of
   `(do (roll) next:#1)` — the TS engine emits only the Roll move, never the
   follow-up movement. That `next:` arm is the actual race/dice fix.
4. **Graph-board move generation** *(the live MOVE_MISMATCH front)* — hunt/
   alquerque trials show TS generating moves from the *wrong site* (Adugo records
   `from=12`, TS offers only `from=14`; Bagh Bandi records `from=40`, TS offers
   `from=48`). Root cause is site-numbering and/or adjacency divergence on custom
   graph boards, now resolved through the faithful core — needs a per-board
   numbering audit against Java's `Topology`.
5. **Vertex/Cell site-kind correctness** — ensure `use:Vertex` boards number and
   move on vertices, not cells.
6. **Sow semantics** — align mancala sowing with `Sow.java`.

Every step is validated by re-running Layer 2 (optionally `--filter <family>`)
and watching OUTCOME_OK rise.

## Numeric fidelity policy

The port matches Java's arithmetic by respecting the *type distinction* Java
makes, not by adding precision Java never had:

- **`double` → JS `number`.** Both are IEEE 754 binary64; `+ - * /` and
  `Math.sqrt` are correctly-rounded and bit-identical across the two languages.
  The geometry path (`MathRoutines.java` and all of `game/util/graph`) is pure
  `double`, so `math.ts` matches Java exactly. A BigDecimal/decimal library would
  *diverge* from Java (which uses doubles) and is the wrong tool here.
  - The only `double` divergence is transcendentals (`atan2`/`sin`/`cos`/`tan`),
    which differ by ≤1 ULP (~1e-16) between libms. The trajectory code consumes
    these only through coarse thresholds (45°/22.5° angle bins, `tan(0.25)` bend),
    so a 1-ULP wobble cannot flip a decision. `absTanAngleDifference3D` and
    `whichSide` are pure arithmetic (no transcendentals) — bit-identical.
- **`long` → `BigInt`.** Java `long` is 64-bit *wrapping* integer arithmetic; JS
  `number` is exact only to 2^53 and never wraps. Every ported `long` must use
  `BigInt` (or explicit 32-bit `| 0` / `Math.imul`). Applies to SplitMix64 (done)
  and any future Zobrist/state-hash or 64-bit bitboard code. **Checklist: when
  porting Java that declares `long`, it gets `BigInt`.**
- **`int` → `number`.** Site ids, counts, etc. are all ≪ 2^53, so plain
  `number` is exact. Only reach for 32-bit ops if Java relies on `int` overflow.

## Running the layers

```sh
# Layer 0 — provenance manifest (+ stale-path check; non-zero exit if stale)
node tools/parity/gen-provenance.mjs

# Layer 1 — feature coverage
node tools/parity/scan-coverage.mjs        # writes COVERAGE.md

# Layer 2 — behavioral parity (the metric)
npx tsc -p tsconfig.json
node test/parity/replay-trials.mjs                 # full corpus
node test/parity/replay-trials.mjs --filter line   # one family, fast

# Layer 3 — golden fixtures from Java (Java already built under the repo)
#   Java side (regenerate fixtures):
#   java -cp <bins:libs> parity.EmitFixture <lud> <rngCsv> <out.fixture.txt>
#   TS side: replay tools/parity/fixtures/*.fixture.txt and diff per-ply hashes
```

## Provenance convention

See `tools/parity/PROVENANCE.md`. Every ported symbol carries
`// @java <repo-relative-path> [Symbol]`; `gen-provenance.mjs` indexes them and
verifies the Java paths still exist. This is how an upstream diff maps to TS.

## Java oracle harnesses (additive, in the Java tree)

- `Language/src/grammar/DumpGrammar.java` — regenerates the EBNF grammar
  (`tools/parity/java-grammar-current.txt`, v1.3.14) via reflection.
- `Core/src/parity/EmitFixture.java` — deterministic seeded playout →
  `move=` / `ply=N hash=<fullHash>` / `winners=` / `rankings=`. Uses SplitMix64
  seeded from an 8-byte state and the fixed Zobrist seed, so output is stable
  across JVM runs. These add no logic; they only read the existing engine.
