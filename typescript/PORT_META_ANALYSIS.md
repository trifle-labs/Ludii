# Ludii Port — Meta-Analysis of Techniques

A living record of HOW the port is being driven, not WHAT was fixed (that's
`PORT_PROGRESS.md`). Purpose: rate each technique's effectiveness so we can tell
when a vein is exhausted and deliberately switch method instead of grinding a
declining approach. **Reflection log at the bottom — newest first. Re-read and
append a reflection roughly every ~5 fixes or whenever hit-rate visibly drops.**

---

## Technique catalog (with effectiveness)

Rating = parity yield per unit effort, as observed. ★★★ = high-leverage,
★★ = steady, ★ = situational, ☠ = dead-end/net-negative.

| # | Technique | Rating | When it works / notes |
|---|-----------|--------|------------------------|
| T1 | **Monolithic interpreter fixes** (edit compile.ts dispatchers directly) | ★★★ early → ★★ now | The workhorse. Trace divergence → find Java line → fix → sweep. Most parity came from here. Now mostly used to land cluster fixes. |
| T2 | **1:1 class-per-file transliteration** (registry + @java provenance) | ★ for parity, ★★★ for traceability | Enables upstream drift-tracking (now 87.6% mapped). Does NOT raise parity directly — interpreter still executes until a ludeme is flipped live. Strategic/organizational, not a parity lever. |
| T3 | **Infrastructure-gap hunting** (find a missing ludeme case/dispatch/default that many games hit) | ★★★ | HIGHEST leverage per fix. One fix ripples across games: `resolveRole(Neutral)=0` (+8), board-geometry missing-cases (+6), `sites:Distance` routing. Found via instrumenting dispatch fall-throughs + replaying MM corpus. CAVEAT: recon shows this vein is ~80% mined out (only ~11 MM games have compile-time gaps left). |
| T4 | **Subsystem build-out** (complete stubbed Java subsystems: deduction-puzzle, hidden-info, 3D, enclose) | ★★ | Additive, low-regression-risk, advances completeness. Good when a whole namespace is stubbed. Largely done. |
| T5 | **Ply-0 / shallow-divergence targeting** (pick games diverging at the start = single-bug, clean) | ★★★ → ★ now | Was high-yield (Icebreaker, Oriath, Ploy). Now ~50% hit-rate: many ply-0 symptoms hide MULTI-bug games with minefield-deep divergences (the ts=1 under-gen cluster — At-Tab/Rabbit Warrens/Shogun — was reverted). Use only when TS generates the right move SHAPE but wrong detail (single-bug signal); avoid Pass-only ts=1 games (multi-bug signal). |
| T6 | **Game-focused multi-bug strategy** (fix ALL of one game's stacked divergences in sequence) | ★★ | Works when a game has 2-6 independent bugs (Cavity). Costly; yields one game + bonus siblings. |
| T7 | **Deterministic measurement** (PER_TRIAL_MS=90000 to kill the 20s timeout-flap) | ★★★ one-time | Methodology breakthrough: removed ±9 noise, recovered ~24 phantom failures. Not a recurring lever but underpins every gate now. |
| T8 | **Monitored sub-agents + gatekeeper** (agent recons/fixes, main loop verifies vs Java + full-sweep-gates) | ★★ | Current delegation model (Codex retired per user). Lets fixes run in parallel. REQUIRES strict gatekeeping: this session reverted 1 whole agent changeset (no OUTCOME gain + minefield risk), reverted 1 agent sub-change (zero-benefit `ifThenForDo`), tightened 1 (restored a dropped fallback), and nearly dropped a useful change until a spot-test corrected me. Agents err/over-bundle — never trust, always verify + sweep. |
| T9 | **Recon-then-fix** (read-only agent ranks targets/causes; I pick + fix) | ★★ | Good for breadth (gap-map, cause-ranking) without committing a fix-agent to a bad target. The gap-map recon reshaped strategy (revealed runtime >> compile gaps). |

## Known minefields (☠ — net-negative, do not re-attempt without a new idea)

- ActionMoveStacking full/partial-stack move semantics + ActionAddCount count-transfer OWNER logic (Bashni/Lasca/Moo/Murus/At-Tab).
- `makeFaces()` / board-graph topology / face renumbering (TS's accumulated numbering beats a faithful Java re-port for more games).
- Board TRACK topology (race/* backgammon-family).
- byScore score-COMPUTATION ranking; result-role end-rule resolution (Splade vs Wong/Agapi tension); teams ranking — all part of the deferred end-rule RANKING model.

## Hard gate (every parity change)

build clean + 501/501 unit tests + full 12-shard 90s sweep (`/tmp/sweep.sh`) net-positive + ZERO real regressions (flap distinguished by re-running the game alone) → promote (copy cur shards to baseline) + `check-java-drift --record` + git commit. Bisect bundled changesets; revert anything inert or risky.

---

## Reflection log (newest first)

### Reflection 1 — 2026-05-31 (parity 54.5%, 1394/2558; +30 this continuation)
**Where the easy yield went.** Six clean wins this continuation came from T3 (infrastructure-gaps: Neutral +8, geometry +6) and T5/T1 (clean ply-0: rotation +2, remove +3, sow +11). Then T5 hit a wall: the ts=1 under-generation cluster (At-Tab/Rabbit Warrens/Shogun/Zombego) was a multi-bug minefield trap → whole changeset reverted (correct gatekeeping, zero yield).

**What the gap-map recon (T9) revealed:** only ~11 MM games have compile-time gaps; **~340 of ~378 MM games compile clean and diverge at RUNTIME.** So T3 (missing-ludeme hunting) is ~80% exhausted. The remaining bulk is:
- **~80 dice-race games** — `(do (roll) next:…)` compound-move / RNG-parity divergences. LARGEST single cluster; plausibly ONE shared root (compound roll+move generation or dice sequencing). **High-leverage candidate — investigate next.**
- **57 mancala wrong-mover** — sow-track `(values Remembered)` state drift. Medium cluster, one likely root.
- **~120 WINNER_MISMATCH** — the deferred scalar-winner-vs-Java-ranking end model. Now LARGE (many MM→WM conversions this session pushed games here). Architectural, high-risk, but high-ceiling.

**Decision / method switch:** singleton ply-0 hunting (T5) has passed its peak — stop defaulting to it. **Pivot to CLUSTER-CAUSE investigation:** spend the next effort on a recon of the dice-race cluster (is there one shared compound-move/RNG bug?) BEFORE fixing, because a single cluster root could outweigh 20 singletons. Keep T3 only for the few remaining clean compile-gaps (claim-in-effect = the from==to scoring games, seq-in-effect = done). Treat the WINNER_MISMATCH ranking model as the major deferred project to scope deliberately (not piecemeal). Reassess after the dice-race recon: if no shared root exists, fall back to T6 game-focused on the highest-value individual games.
