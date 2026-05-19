# Browser-Player Roadmap

Where `@ludii/typescript-browser-player` goes between today's placeholder
demo and a real Ludii-backed game in the browser.

This document specifies the **contract** the DOM layer expects from the
engine. The engine port (`@ludii/typescript-common` + future
`@ludii/typescript-engine`) must satisfy this contract before the
browser-player can retire the hand-rolled `TicTacToeGame`.

Companion documents:
- [`MVE.md`](MVE.md) — the engine classes that have to land first.
- [`API_SHAPE.md`](API_SHAPE.md) — how Java idioms map into TS.

## Today's state

The package currently ships:

- `TicTacToeGame` — a hand-rolled deterministic game model used to prove
  the workspace can drive DOM updates. Not derived from a ported
  `Game.java`.
- `EmbeddedTicTacToe` — a DOM-driven embeddable surface that talks to
  `TicTacToeGame` directly.
- `demo/index.html` — a zero-build demo page for manual checks.

The placeholder game is intentional. It pins the DOM contract so the
engine port has a target.

## The contract the DOM layer expects

The DOM layer needs **five** capabilities. The placeholder `TicTacToeGame`
already exposes shapes equivalent to these; every real Ludii game must
expose the same shapes (possibly via an adapter).

### 1. Construct a game

```ts
interface BrowserGame {
  /** Stable identifier (e.g. "tic-tac-toe", or eventually a .lud hash). */
  readonly id: string;

  /** Human-readable name for the UI. */
  readonly name: string;

  /** Number of players (1..N). */
  readonly numPlayers: number;
}
```

Equivalent Java: `Game.name()`, `Game.players().count()`.

### 2. Build initial state

```ts
interface BrowserGameSession {
  readonly game: BrowserGame;
  readonly state: BrowserState;
  readonly trial: BrowserTrial;

  /** Mover index, 1-based to match Java conventions. */
  readonly mover: number;

  /** True iff the trial is terminal. */
  readonly over: boolean;

  /** Winner mover index, or 0 for a draw, or -1 if not over. */
  readonly winner: number;
}
```

Equivalent Java: `Context` wrapping a `Trial` + `State`.

### 3. Render state to the DOM

```ts
interface BrowserState {
  /** Read-only flat view of cell contents for the current mover. */
  cellAt(siteIndex: number): CellView;
  readonly siteCount: number;
}

interface CellView {
  /** Owning player (1..N) or 0 if empty. */
  readonly owner: number;
  /** Optional component label (e.g. piece name) for UI rendering. */
  readonly componentLabel?: string;
}
```

Equivalent Java: subset of `State.containerStates(...)`. Rendering only
needs to know "who owns site `i`" plus a component label. Anything more
nuanced (stacking, hidden info, etc.) is post-MVE.

### 4. Enumerate legal moves

```ts
interface BrowserMove {
  /** Stable id of this move, used as the React/DOM key. */
  readonly id: string;

  /** Human-readable label for an action menu (e.g. "Play X at (2,3)"). */
  readonly label: string;

  /** Sites this move touches (for hover-highlight). */
  readonly siteIndices: readonly number[];
}

interface BrowserGameSession {
  legalMoves(): readonly BrowserMove[];
  /** Subset of legalMoves() filtered to those that touch this site. */
  legalMovesAtSite(siteIndex: number): readonly BrowserMove[];
}
```

Equivalent Java: `Game.moves(Context)`, optionally filtered.

### 5. Apply a move

```ts
interface BrowserGameSession {
  /** Returns a NEW session with the move applied. Original is unchanged. */
  apply(moveId: string): BrowserGameSession;
}
```

Equivalent Java: `Game.apply(Context, Move)` — but the browser layer
expects immutability at the session level. The underlying `State` /
`Trial` may be mutated; the wrapper produces a new view object.

## What's intentionally **off** the critical path

- AI agents — the demo can be human-vs-human until search is ported.
- Networked multiplayer — out of scope until the single-page version
  works end-to-end.
- Animation timing / piece transitions — re-render is fine for MVE.
- Hidden-information rendering — only fully observable games for MVE.
- Save/load — a JSON-encoded move log is post-MVE.

## Phase plan

### Phase 0 — current

- Placeholder `TicTacToeGame` + `EmbeddedTicTacToe` + demo HTML.
- DOM contract pinned by the placeholder.

### Phase 1 — replace the placeholder with a real ported game

Prerequisites: Tier 1 + Tier 2 ports from [`MVE.md`](MVE.md).

Deliverable: a `BrowserGameSession` adapter (in
`@ludii/typescript-browser-player`) that wraps the ported `Context`,
`State`, `Trial`, and `Game`. The first concrete target is tic-tac-toe
built programmatically (not from a `.lud`).

Done when:
- The demo HTML renders tic-tac-toe using the ported engine.
- A complete 2-player game can be played to terminal in the browser.
- Move IDs are stable across re-renders.
- Parity test: same move sequence in TS and in Java produces the same
  final `State` hash.

### Phase 2 — second concrete game

Pick something with stacking or non-square topology (e.g. Hex). Confirm
the contract holds without modification. If it doesn't, capture the
delta here and update the contract.

### Phase 3 — load games from `.lud`

Prerequisites: parser pipeline lands in `@ludii/typescript-language`.
Replace the hard-coded `Game` builder with parse → compile → instance.

### Phase 4 — UX surface

- Move-history sidebar driven by `Trial`.
- Undo/redo via the existing `Trial` step list.
- Optional: keyboard navigation, animation, themes.

## How the contract is enforced

- The `BrowserGame` / `BrowserGameSession` / etc. interfaces live in
  `@ludii/typescript-browser-player`. The engine port satisfies them
  via an adapter, not by implementing them directly on the engine
  classes.
- Tests on the adapter live alongside it in the browser-player package.
- A parity fixture (per the in-progress fixture pattern) confirms TS
  and Java agree on the final state hash for a known move sequence.

## Open questions

1. **Will the parser ever run in the browser, or only via a pre-compile
   step?** Affects bundle size by ~ the entire grammar.
2. **How are localised game names handled?** Java uses metadata files;
   the browser package may just ship a small i18n map.
3. **Touch vs mouse vs keyboard input model.** Out of scope for MVE,
   needs a decision before UX work.
