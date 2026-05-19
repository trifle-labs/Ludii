# Minimum Viable Engine (MVE) Module List

Goal: identify the smallest set of Java classes that need a TypeScript port
before a browser session can construct a real Ludii `Game`, build its
state, play moves end-to-end, and query terminal/winner.

This is a planning document, not a binding spec. Update as ports land and
the actual dependency frontier shifts.

## What "MVE" means here

The browser-player package already ships a hand-rolled `TicTacToeGame` to
prove the workspace can drive DOM updates. The MVE is the next milestone:
**replace that placeholder with a real Ludii `Game` instance**, even if
only one or two game `.lud` descriptions are supported initially.

A working MVE needs four capability slices:

1. **Construct a game** from a parsed description (initially: a Java-side
   pre-compiled fixture, eventually a `.lud` text input).
2. **Initialise state** for that game (board, components, player ownership).
3. **Generate legal moves** for the current player.
4. **Apply a move** and detect terminal conditions / winner.

Anything not on the critical path for those four slices is *not* MVE.
That excludes AI search, replay/trial mining, tournament harness,
metadata, and the entire `Mining/`, `Evaluation/`, and `Player*` modules.

## Critical-path Java classes (prioritised)

Sizes shown as line counts so reviewers can spot which ports will need to
be broken into sub-tasks.

### Tier 0 — already landed

| Class | Path | Lines | Status |
|---|---|---:|---|
| `FVector` | `Common/src/main/collections/FVector.java` | – | ✅ in `@ludii/typescript-common` |
| `FastArrayList` | `Common/src/main/collections/FastArrayList.java` | – | ✅ in `@ludii/typescript-common` |
| `ChunkSet` | `Common/src/main/collections/ChunkSet.java` | – | ✅ in `@ludii/typescript-common` |
| `BitSet` | `java.util.BitSet` (JDK) | – | ✅ ported from scratch into `@ludii/typescript-common` |
| `HashedBitSet` | `Core/src/other/state/zhash/HashedBitSet.java` | 175 | ✅ in `@ludii/typescript-common` |

### Tier 1 — engine kernel (next 4–5 ports)

These are the smallest classes on the critical path. Port them next.

| # | Class | Path | Lines | Notes |
|---|---|---|---:|---|
| 1 | `Move` | `Core/src/other/move/Move.java` | 1727 | Big, but unblocks every move-generation pathway. Likely split into sub-ports (sequence of `Action`s, score/value bookkeeping, etc.). |
| 2 | `Action` (base + a handful of subclasses) | `Core/src/other/action/Action.java` and `Core/src/other/action/move/Action*.java` | varies | Pick the 3–5 actions needed for the first target game (e.g. `ActionAdd`, `ActionMove`, `ActionRemove`). |
| 3 | `State` | `Core/src/other/state/State.java` | 2228 | Container holding the per-game mutable state. Split: the data members port first, the convenience methods follow. |
| 4 | `ContainerState` | `Core/src/other/state/container/*` | varies | One per board/container type; start with the simplest (flat container) needed for a 2D-board game. |
| 5 | `Trial` | `Core/src/other/trial/Trial.java` | – | Records the move list + per-move state hashes. Smaller than `State`/`Game` but transitively depends on `Move`. |

### Tier 2 — context + game shell

| # | Class | Path | Notes |
|---|---|---|---|
| 6 | `Context` | `Core/src/other/context/Context.java` (1765 lines) | The runtime container holding `Game` + `Trial` + `State`. Most engine entry points take a `Context`. |
| 7 | `Game` (skeleton + `start()` / `apply()`) | `Core/src/game/Game.java` (4037 lines) | Port the surface API the browser needs: `start(Context)`, `apply(Context, Move)`, `moves(Context)`, `over(Context)`. Defer the full ludeme tree. |
| 8 | A single concrete `Mode` | `Core/src/game/mode/*` | Pick `Alternating` for two-player turn-taking. |
| 9 | Minimum board topology | `Core/src/other/topology/Topology.java` (+ `Vertex`, `Edge`, `Cell`) | Required to lay out the board for any non-trivial game. Port the data side first; defer the graph-construction helpers. |

### Tier 3 — entry point

| # | Class | Path | Notes |
|---|---|---|---|
| 10 | `API` | `Core/src/game/API.java` (78 lines) | Trivial port. The interface the browser-player actually calls into. |
| 11 | `GameLoader` (browser variant) | `Core/src/other/GameLoader.java` | Initially: skip filesystem loading entirely; ship one hard-coded `Game` instance built by hand. |

## What's intentionally **not** in the MVE

- **Parser pipeline** (`Language/src/parser/*`): the MVE constructs a `Game`
  programmatically. The parser stays gated behind its own milestone.
- **`Mining/` and `Evaluation/`**: 2 GB of trial logs and CSVs; pure
  off-engine work.
- **AI**: `Core/src/other/AI.java` and friends. The browser-player can
  prompt the user for both sides.
- **`PlayerDesktop/`, `PlayerAndroid/`, `ViewController/`**: Java/Swing
  UI; the TS port has its own DOM surface.
- **Metadata and tournament infrastructure**.

## Suggested first concrete game

Tic-tac-toe (or Nim, or Hex 3×3) — small enough that:
- the `Game` constructor doesn't need the full ludeme tree
- only a handful of `Action` subclasses are required
- terminal detection is a single line-check rule

Once one real game runs end-to-end in the browser via the actual ported
`State` / `Trial` / `Context`, the placeholder `TicTacToeGame` in
`@ludii/typescript-browser-player` can be retired.

## Acceptance checklist for MVE

- [ ] All Tier 1 and Tier 2 classes ported with parity tests
- [ ] `@ludii/typescript-browser-player` can construct a real `Game`
- [ ] A user can play a complete 2-player tic-tac-toe (or equivalent) in
      the browser demo, with `State` / `Trial` driven by the ported engine
- [ ] Terminal + winner state matches the Java engine for the same move
      sequence (parity fixture)
- [ ] Per-move state hash matches the Java engine for the same move
      sequence (parity fixture)

Stretch (post-MVE): a `Game` constructed from a parsed `.lud` string,
which unblocks any subset of Ludii's game catalogue at once.
