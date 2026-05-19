# Issue Triage Backlog

GitHub Issues are **disabled** on this repository (verified via
`gh issue list` → "the 'trifle-labs/Ludii' repository has disabled
issues"). This document is the issue-tracker stand-in: a list of
ready-to-file issue bodies covering the open Track A items and the
upcoming MVE-tier ports.

When issues are enabled, paste each entry below as a new issue. Each is
sized to fit on a single screen and pre-filled with title, body, and
suggested labels.

Status of the closed Track A items is captured directly in
[`TODO.md`](../../TODO.md); they don't need backfilled issues.

---

## Open Track A item still to file

### Issue: Add a shared parity-test fixture pattern

**Title:** `chore(common): document and implement shared parity-test fixture pattern`

**Suggested labels:** `enhancement`, `testing`, `track-a`

**Body:**

The TS port currently uses ad-hoc Java→TS assertions inside each test
file. Define a single fixture pattern (Java behaviour snapshots → TS
assertions) and document it in `typescript/README.md`.

Acceptance:

- [ ] A `typescript/packages/common/test/__fixtures__/` directory (or
      equivalent) with one canonical example fixture format (probably
      JSON snapshots captured from a tiny Java harness).
- [ ] A helper in `@ludii/typescript-common` (or a `-testing` sibling
      package) that loads a fixture and asserts the TS implementation
      reproduces it.
- [ ] At least one existing test (e.g. `BitSet.hashCode`) migrated to
      use the new pattern, with the Java snapshot committed.
- [ ] `typescript/README.md` documents the workflow:
      - how to generate a fresh snapshot from Java
      - how to consume it from TS tests
      - when to refresh

> **Note:** This item is marked 🚧 in TODO.md as already being worked
> on by another contributor. Don't double-claim.

---

## Upcoming Track A items — MVE Tier 1

These come straight from [`MVE.md`](MVE.md). File them as the parser
fixture pattern lands and the engine kernel becomes the next focus.

### Issue: Port `Move` (Core/src/other/move/Move.java)

**Title:** `feat(common|engine): port Move with parity tests`

**Suggested labels:** `port`, `track-a`, `mve`

**Body:**

Port `Core/src/other/move/Move.java` (1727 lines) into a new
`@ludii/typescript-engine` package (or `@ludii/typescript-common` if it
remains leaf-y enough). Likely split:

- core `Move` data members and action sequence
- score / value bookkeeping methods
- equality / hashing

Done when the package README and TODO.md tick the new module off per
the `Done criteria for each ported module` checklist.

Java source: `Core/src/other/move/Move.java`.

---

### Issue: Port a starter set of `Action` subclasses

**Title:** `feat(engine): port starter Action subclasses (Add/Move/Remove)`

**Suggested labels:** `port`, `track-a`, `mve`

**Body:**

Port the small set of `Action` subclasses needed for the first
concrete browser game (tic-tac-toe / Nim):

- `ActionAdd`
- `ActionMove`
- `ActionRemove`
- plus the abstract `Action` base

Java source: `Core/src/other/action/`.

Defer the long tail of subclasses (`ActionPromote`, `ActionInsert`,
`ActionSubStackMove`, etc.) until a real game needs them.

---

### Issue: Port `State`

**Title:** `feat(engine): port State (Core/src/other/state/State.java)`

**Suggested labels:** `port`, `track-a`, `mve`

**Body:**

Port `Core/src/other/state/State.java` (2228 lines) into
`@ludii/typescript-engine`. Two-pass split recommended:

1. Data members + simple accessors first; tests stub the heavier
   collaborators with the existing adapter interfaces.
2. The full move-application surface afterwards.

Java source: `Core/src/other/state/State.java`.

---

### Issue: Port a single `ContainerState`

**Title:** `feat(engine): port one ContainerState for a flat 2D board`

**Suggested labels:** `port`, `track-a`, `mve`

**Body:**

Port whichever `Core/src/other/state/container/*` subclass best models
a flat 2D board with one site per cell. Used as the storage backing
for `State` in the first concrete game.

Java source: `Core/src/other/state/container/`.

---

### Issue: Port `Trial`

**Title:** `feat(engine): port Trial (Core/src/other/trial/Trial.java)`

**Suggested labels:** `port`, `track-a`, `mve`

**Body:**

Port `Core/src/other/trial/Trial.java`. Records the move list + per-move
state hashes, enabling deterministic replay and serving as the
DOM-layer's `Trial` for the move-history sidebar in the roadmap.

Java source: `Core/src/other/trial/Trial.java`.

---

## Upcoming Track A items — MVE Tier 2

### Issue: Port `Context`

**Title:** `feat(engine): port Context (Core/src/other/context/Context.java)`

**Body:**

Port `Core/src/other/context/Context.java` (1765 lines). Holds
`Game` + `Trial` + `State`; most engine entry points take a
`Context`. Probably the largest single port of the MVE.

---

### Issue: Port `Game` skeleton + `start` / `apply` / `moves` / `over`

**Title:** `feat(engine): port Game surface API for MVE`

**Body:**

Port the subset of `Core/src/game/Game.java` (4037 lines) that the
browser-player calls:

- `start(Context)`
- `apply(Context, Move)`
- `moves(Context)`
- `over(Context)`

Defer the full ludeme tree behind a `defer-port` follow-up issue.

---

### Issue: Port one concrete `Mode` (`Alternating`)

**Title:** `feat(engine): port AlternatingMode`

**Body:**

Port `Core/src/game/mode/AlternatingMode.java` (or equivalent) to
support two-player turn-taking. Defer simultaneous / stochastic modes.

---

### Issue: Port minimum-viable topology (`Topology` + `Vertex` + `Edge` +
`Cell`)

**Title:** `feat(engine): port flat-board Topology`

**Body:**

Port the data side of `Core/src/other/topology/Topology.java` and its
`Vertex` / `Edge` / `Cell` siblings. Defer graph-construction helpers
until needed.

---

## Upcoming Track A items — MVE Tier 3

### Issue: Port `API`

**Title:** `feat(engine): port API (Core/src/game/API.java)`

**Body:**

Port `Core/src/game/API.java` (78 lines). Trivial port; the interface
the browser-player actually calls into.

---

### Issue: Browser `GameLoader` stub

**Title:** `feat(browser-player): hard-coded GameLoader stub for MVE`

**Body:**

Initially: skip filesystem loading entirely; ship one hard-coded `Game`
instance built programmatically (tic-tac-toe). The full
`Core/src/other/GameLoader.java` port comes after the parser pipeline
lands.

---

## How to use this list

1. When issues get enabled on the repo, paste each entry above as a
   new issue.
2. Cross-link the issue back to the relevant Track A bullet in
   `TODO.md` and the relevant tier in `MVE.md`.
3. Delete that entry from this file once filed. The file disappears
   once everything is filed.
