# Browser Demo: QA Notes + UX Requirements

Manual-QA notes for `typescript/packages/browser-player/demo/index.html`.

**Scope:** the placeholder `TicTacToeGame` + `EmbeddedTicTacToe` surface.
The QA below is split into

1. **Static review** — findings derived from reading
   `src/embed.ts`, `src/ticTacToe.ts`, and the demo HTML.
2. **Browser-test checklist** — what to walk through in a real
   browser (cannot be fully verified by static review).
3. **UX requirements** — the design constraints that fall out of
   what the demo needs to demonstrate.

This document is meant to live alongside the demo and be updated when
the placeholder gets replaced by a real ported `Game`.

---

## How to run the demo

```bash
cd <repo-root>
npm install
npm run build --workspace @ludii/typescript-browser-player
```

Then open `typescript/packages/browser-player/demo/index.html` directly
or via a local static server:

```bash
npx --yes http-server typescript/packages/browser-player/demo -p 5173
```

(See the dependency timelock in [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
before adding any new dev tooling.)

---

## 1. Static review findings

Based on a code read of:

- `typescript/packages/browser-player/src/embed.ts`
- `typescript/packages/browser-player/src/ticTacToe.ts`
- `typescript/packages/browser-player/demo/index.html`

### What looks correct

- Inline styles are scoped under a single `#ludii-browser-player-styles`
  `<style>` element with an `id` guard, so re-embedding doesn't duplicate
  styles.
- `resolveContainer` accepts both an `HTMLElement` and a string
  selector and throws if the selector matches nothing.
- Cells use `<button type="button">` with an `aria-label`
  (`Cell N`), which is the right accessibility primitive.
- `disabled` is set on filled cells **and** when the game is over —
  prevents post-terminal clicks.
- Reset re-renders from a fresh game state; no stale DOM.

### Gaps / risks

These are all minor for a placeholder, but they're the kind of thing
that will trip a real game port:

1. **Outcome label uses raw player identifier.**
   `outcomeLabel` prints `"Winner: ${state.outcome}"`. For tic-tac-toe
   the outcome is the string `"X"` / `"O"`. A real ported game will
   surface a numeric mover index (1..N), so the label format needs to
   become `"Winner: Player ${mover}"` or pluggable.
2. **No move log / history.** The roadmap calls for a sidebar driven
   by `Trial`. The current demo has nowhere to render it.
3. **Reset is destructive without confirmation.** Acceptable for
   tic-tac-toe; surprising for a 50-move game. Will need a confirm
   prompt or an "Undo" alternative once `Trial` lands.
4. **No keyboard navigation across cells.** Tab order works (native
   `<button>` semantics) but there's no arrow-key grid navigation,
   which is the convention for board games.
5. **No live region for status updates.** The status `<p>` updates
   on each move but isn't an `aria-live` region, so screen-reader
   users only hear the new mover on next focus.
6. **No focus management after reset.** Clicking Reset doesn't move
   focus back to the board, so keyboard users have to tab back in.
7. **No mobile-specific affordances.** The grid is responsive but cell
   font size (`2rem`) may be too small on small phones; no touch-
   target sizing minimum.
8. **No way to seat multiple sessions on one page.** Two embeds on
   one page would share the same `<style>` element (fine) but their
   container parameter has to be distinct; this isn't documented in
   the public API.
9. **No bundling story for consumers.** The demo loads
   `../dist/src/demo.js` directly via a relative path. A library
   consumer would expect a single ESM entry from the package — the
   `index.ts` exports `createTicTacToeEmbed` but that isn't shown in
   the demo.

None of these block the placeholder's purpose (proving the workspace
can drive DOM). They become acceptance criteria for the real
`@ludii/typescript-browser-player` once the engine port lands.

---

## 2. Browser-test checklist

Anyone running the demo in a real browser should walk through this
list. **Static review can't verify any of these.**

Functional:

- [ ] Page loads without console errors.
- [ ] All nine cells render and are clickable.
- [ ] Clicking an empty cell places the current player's mark.
- [ ] Clicking a filled cell is a no-op (the button is `disabled`).
- [ ] After a win, every remaining empty cell becomes disabled.
- [ ] After a win, the status reads `Winner: X` / `Winner: O`.
- [ ] After a draw, the status reads `Draw`.
- [ ] The Reset button restores a fresh, empty board.
- [ ] The current-player label updates after every move.

Accessibility:

- [ ] All cells are focusable via Tab.
- [ ] Each cell announces its label (`Cell 1` … `Cell 9`) under a
      screen reader.
- [ ] Reset button is reachable and labelled "Reset".
- [ ] Page passes a contrast check at default zoom (the existing
      `#8c959f` border on `#ffffff` is borderline at 1× zoom).

Responsive / mobile:

- [ ] At 320px viewport width the board still fits inside the
      `.ludii-embed` card.
- [ ] Cells are at least 44×44px on a phone (Apple HIG / Material).
- [ ] No horizontal scrollbar at 320px.

Visual regression:

- [ ] Cards have rounded corners (12px) and a soft border.
- [ ] Cell hover state is visually distinct from focus state.
- [ ] Reset button has hover/focus feedback.

Stress / error paths:

- [ ] Rapidly clicking the same cell does not produce duplicate
      moves (relies on the `disabled` state being set synchronously
      with the move).
- [ ] Resizing the viewport mid-game does not lose state.
- [ ] Refreshing the page returns to an empty board (state is not
      persisted — confirm this is the intent).

---

## 3. UX requirements (going forward)

These are the requirements the **real** ported-engine browser-player
must meet to be considered shippable. They derive from the static
review above plus the
[`BROWSER_PLAYER_ROADMAP.md`](BROWSER_PLAYER_ROADMAP.md) contract.

### Must-haves before retiring the placeholder

1. **Generic outcome formatter.** Take `mover: number` and a
   game-supplied player-label mapping; never hard-code `"X"`/`"O"`.
2. **Keyboard grid navigation.** Arrow keys move between sites on the
   board; Enter / Space plays the move. The grid topology comes from
   the engine, not the DOM layer.
3. **Live status region.** `<p role="status" aria-live="polite">` for
   move announcements and terminal state.
4. **Focus restoration after Reset.** After clicking Reset, focus
   moves back to the first focusable site.
5. **Move history sidebar.** Read-only list driven by `Trial`. Click
   an entry to scrub the board to that move (read-only; not undo).
6. **Touch targets ≥ 44px** on small viewports.
7. **One embed per page guarantee at minimum.** Re-entrancy on the
   same page is a Phase 2 concern; if multi-instance is needed, the
   shared `<style>` element must remain a single source of truth.

### Should-haves

8. **Theming hook.** Expose CSS custom properties for cell background,
   border, focus colour, and font.
9. **Optional confirmation on Reset** for games with >N moves played.
10. **Replay scrubber.** Backed by the existing `Trial` state-hash
    list; doesn't require new state-machine work.
11. **Mover-attribution colour cue.** Each mover gets a distinct
    colour swatch; matches the colour used in the status region.

### Out of scope for v1

- Animation between states (re-render is fine).
- Networked multiplayer.
- Persistence to `localStorage`.
- Hidden-information rendering for games like poker.
- Game catalogue / `.lud` picker.

---

## Status

- Static review: complete (this document).
- Browser walk-through: pending a human pass — see the checklist
  above. Note in the task tracker when done.
- UX requirements: ratified for the placeholder phase; revisit when
  the real ported `Game` lands per the roadmap.
