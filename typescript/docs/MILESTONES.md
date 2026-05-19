# Browser-Player Milestones — Vertical Slice

The roadmap in [`BROWSER_PLAYER_ROADMAP.md`](BROWSER_PLAYER_ROADMAP.md)
splits the journey into four phases. The TODO.md Track A list closed out
the leaf-level porting groundwork. This document tracks the **milestone-
level** work that drives the browser-player from the placeholder demo
all the way to a `.lud`-loaded game in the browser.

Approach: a thin vertical slice that touches every phase, sized for a
single contributor session. Each item below is independently
committable.

Legend:
- 🚧 in progress
- ✅ done
- ⬜ open

**Status:** Milestones 1–7 all landed. The vertical slice from
TS-native engine through `.lud` loading to a move-history-equipped
browser demo is complete on `copilot/port-library-to-typescript`. The
follow-up surface (Phase 2 second game, byte-for-byte Java engine
ports, expanded `.lud` syntax) is tracked in
[`BROWSER_PLAYER_ROADMAP.md`](BROWSER_PLAYER_ROADMAP.md) and
[`ISSUE_BACKLOG.md`](ISSUE_BACKLOG.md).

---

## Milestone 1 — Engine package skeleton

✅ Created `@ludii/typescript-engine` with the minimum surface to satisfy
the `BrowserGameSession` contract:

- `Move` (immutable value object with `id`, `label`, `siteIndices`,
  `apply(state) → state`)
- `State` (mover, frozen cell array, immutable `withCell(i, owner)`)
- `Trial` (move history, terminal flag, winner)
- `Game` (abstract `start()`, `moves(context)`, `apply(context, move)`,
  `over(context)`)
- `FlatBoardGame` (NxN board with "place on empty until N-in-a-row")

Acceptance:
- Unit tests cover a complete tic-tac-toe playthrough (win + draw).
- Workspace lint/build/test stay green.

## Milestone 2 — Browser adapter for ported engine

✅ Replaced the `TicTacToeGame` placeholder with a real adapter:

- `BrowserGameSession` implementation that wraps a `Context`
- `EmbeddedLudii` (renamed from `EmbeddedTicTacToe`) that takes a
  `BrowserGameSession` and renders it
- Backwards-compatible `createTicTacToeEmbed(...)` keeps the existing
  demo working

Acceptance:
- Demo HTML still plays tic-tac-toe end-to-end.
- Demo HTML proves the engine drives DOM (e.g. via a hard-coded
  `FlatBoardGame.tictactoe()` factory).

## Milestone 3 — `.lud` parser primitives

✅ Added a minimal S-expression parser to
`@ludii/typescript-language`:

- Lexer: tokens for parens (round + curly), strings, numbers,
  identifiers, comments (`//` line comments).
- Parser: produces an AST (`LudNode = LudList | LudAtom | LudString |
  LudNumber`).
- Coverage: enough to parse the full
  `Common/res/lud/test/Tic-Tac-Toe Renamed.lud` file.

Acceptance:
- Round-trip-safe tokenization (strings preserve content).
- AST shapes have predictable accessors (`isList`, `head`, `tail`,
  `asString`, ...).
- Parser handles nested `()` and `{}`.

## Milestone 4 — Lud compiler for the tic-tac-toe subset

✅ Walks the AST and instantiates engine objects.

- Recognise the `(game name (players N) (equipment {...}) (rules
  ...))` shape.
- From `(board (square N))`, build an NxN `FlatBoardGame`.
- From `(end (if (is Line K) (result Mover Win)))` extract the line
  length K.
- Anything outside this subset → throw a labelled `LudCompileError` so
  the failure mode is obvious.

Acceptance:
- Loading the corpus `Tic-Tac-Toe Renamed.lud` produces a playable
  `Game`.
- Final state hash matches a manually-constructed `FlatBoardGame`.

## Milestone 5 — Browser demo loads `.lud` strings

✅ Demo updated. `demo/index.html` exposes a `.lud` textarea + Load
button; `createLudGameEmbed(container, ludSource)` parses → compiles →
renders.

Acceptance:
- `createLudGameEmbed(container, ludSource)` exists and works.
- Demo HTML includes a textarea preset with the tic-tac-toe `.lud`.

## Milestone 6 — Move-history sidebar (Phase 4 partial)

✅ Read-only list driven by `Trial`; rows scrub the board via
`session.truncate(n)`.

Acceptance:
- Each move shows up as a row.
- Click → board scrubs to that move (read-only; not undo).
- Reset focus goes back to the first focusable cell.

## Milestone 7 — Document the new surface

✅ Updated:
- Root `typescript/README.md` parity table with the engine package
- `BROWSER_PLAYER_ROADMAP.md` — mark Phases 1–3 done, Phase 4 partial
- `MILESTONES.md` (this file) — mark each milestone ✅

---

## Out of scope for this slice

- The full Java `Game`/`State`/`Trial`/`Context` ports (the engine
  here is a TS-native subset that satisfies the same external
  contract — exact parity is a follow-up, tracked in
  [`ISSUE_BACKLOG.md`](ISSUE_BACKLOG.md))
- Stochastic / simultaneous / asymmetric games
- Hidden information
- AI players
- Networked multiplayer
- Animation timing
