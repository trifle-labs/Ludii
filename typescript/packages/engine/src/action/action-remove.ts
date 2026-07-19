// @java Core/src/other/action/move/remove/ActionRemove.java ActionRemove
/**
 * Java parity:
 * - Core/src/other/action/move/remove/ActionRemove.java — the
 *   "remove one or more pieces from a site" action.
 *
 * Subset ported: deterministic data members (to / count / level) plus
 * the core `apply(state) → state` semantics: the piece at `to` is
 * cleared. Hidden info and the long tail of optional parameters are
 * deferred.
 */

import { maintainOnTrackIndicesForRemove } from "../on-track-indices.js";
import type { State } from "../state.js";
import { ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

export interface ActionRemoveOptions {
  /** Target site index to clear. */
  readonly to: number;
  /** Number of pieces to remove. Defaults to 1. */
  readonly count?: number;
  /** Stack level (defaults to `Constants.UNDEFINED`, i.e. top piece). */
  readonly level?: number;
  /** @java Remove at:EndOfTurn — queue in sitesToRemove instead of applying. */
  readonly endOfTurn?: boolean;
  readonly type?: SiteType;
  /**
   * Java parity: in a non-stacking game (`Game.isStacking() == false`)
   * `(remove)` clears the ENTIRE site — `ContainerFlatState.remove` calls
   * `setSite(…,0,0,0,0,0,0)`, zeroing who/what/count regardless of pile size.
   * Set true for flat games (mancala pits, etc.) so a multi-seed pile is wiped
   * in one action rather than decremented. Defaults false → stacking-style
   * pop (decrement the pile, leaving the remainder) for real stacks like
   * Bagh goat stacks / Murus Gallicus.
   */
  readonly clearAll?: boolean;
}

export class ActionRemove extends BaseAction {
  public static readonly TYPE: ActionType = "Remove";

  private readonly toIndex: number;
  private readonly countValue: number;
  private level: number;
  private readonly siteType: SiteType;
  /** True when the constructor received an explicit site type. */
  private readonly explicitTyped: boolean = false;
  private readonly clearAll: boolean;

  public constructor(options: ActionRemoveOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionRemove.to must be a non-negative integer.");
    }
    this.toIndex = options.to;
    this.countValue = options.count ?? 1;
    this.level = options.level ?? ACTION_UNDEFINED;
    this.siteType = options.type ?? "Cell";
    this.explicitTyped = options.type !== undefined;
    this.clearAll = options.clearAll ?? false;
  }

  public override apply(state: State): State {
    // Dual-SiteType (@java cs.remove(site, type)): an explicitly typed remove
    // with a typed channel clears THAT channel (Guerrilla's surrounded-cell
    // capture (remove Cell (site)) on a Vertex-play board).
    if (this.explicitTyped && state.typedSites.has(this.siteType)) {
      return state.withTypedSite(this.siteType, this.toIndex, 0, 0, 0);
    }
    // @java ActionRemove with an explicit LEVEL on a real stack removes ONLY
    // that level and shifts the rest down (withStackPop(level)) — NOT the whole
    // pile. (remove X level:0) trims a full column's bottom (Complica).
    //
    // A materialised length-1 `stacks[toIndex]` is only a GENUINE single
    // per-level piece when no countAt pile multiplier rides behind it — a
    // hand seeded with `(place Stack "disc" (handSite) count:N)`, or a board
    // site several identical pieces merged onto, stores its pieces as ONE
    // stack marker plus countAt=N (@java ActionMoveTopPiece's count-pile
    // shape, documented in action-move.ts). Gating strictly on `> 1` here
    // left that length-1-but-countAt>1 case (and a genuine length-1 stack
    // with no countAt residue) falling through to the flat-clear fallback
    // below, which cleared only cells/whats/countAt and never touched
    // `state.stacks[toIndex]` — a stale single-level entry (e.g. Neutral's
    // owner-0 marker) survived and a LATER stacking Move's unconditional
    // `withStackPush` at that site read the ghost array and appended onto
    // it, producing a spurious extra level (Chukaray MOVE_MISMATCH ply
    // 100/211: a piece resurfaced several sites behind where Java expected
    // it, after a Neutral "Stick0" marker was supposedly stripped by
    // `(remove (to) level:0)`). Excluding the countAt>1 pile case keeps
    // Udat Pagada's `(forEach Level (to) FromTop (remove (to) level:(level)))`
    // — which fires N times over an N-deep hand-entry countAt pile — routed
    // through the pile-decrement fallback below instead of draining the
    // whole pile on the first call (WINNER_MISMATCH: the other N-1 pieces
    // would otherwise vanish along with the first, and TS reported the
    // trial not-over at Java's recorded win ply).
    const toStackLen = state.stacks[this.toIndex]?.length ?? 0;
    const isCountPile = toStackLen === 1 && state.countAtSite(this.toIndex) > 1;
    if (this.level >= 0 && toStackLen > 0 && !isCountPile) {
      let nx = state;
      // The removed level's component id, read before the level is popped,
      // so the track-index structure can drop it — mirrors the flat-clear
      // path below (@java ActionRemoveLevel.java:220-235 also maintains
      // onTrackIndices for an explicit-level bear-off; this branch omitted
      // it, silently leaving a stale ring-index entry for the borne-off
      // piece and blocking its later hand-entry move).
      const removedLevelWhat = nx.whatAtSiteLevel(this.toIndex, this.level);
      if (nx.ownedEntries !== undefined) {
        const own = nx.stackAt(this.toIndex, this.level);
        const wht = nx.whatAtSiteLevel(this.toIndex, this.level);
        nx = nx.withOwnedRemoveLevel(own, wht, this.toIndex, this.level);
      }
      // @java ActionRemoveLevel.java:196 → cs.remove(state, to, level, type),
      // which bottoms out in the SAME `ContainerGraphStateStacks.java:1003-1044`
      // shift-loop as ActionMoveLevelFrom's vacate side (see action-move-level.ts):
      // who/what/state/rotation/value shift down for every index below `level`,
      // but only who/what get explicitly cleared at the OLD TOP physical index
      // (`stackSize - 1`) afterwards — that index's `state` is simply never
      // written again, regardless of which `level` was actually removed. TS's
      // stack model instead splices the per-level arrays down, losing that stale
      // value entirely — stash it in the shadow `residualStateAt` channel (see
      // its doc comment in state.ts) before the splice runs, so a LATER
      // hand-exit push landing on this exact physical depth can resurface it
      // (Boolik: `(remove (last From) level:(level))` in RemoveCapturedPieces
      // leaves a captured piece's state=2 marker stale at the vacated top
      // physical depth; a later re-entering piece pushed there by
      // `EnterAPiece` must see that stale state=2, not a clean 0, or it is
      // wrongly treated as a FreePiece with a legal move Java has none for).
      const oldTopLevel = nx.stackSize(this.toIndex) - 1;
      const preClearState = oldTopLevel >= 0 ? nx.stateAtLevel(this.toIndex, oldTopLevel) : 0;
      if (nx.stackingGame && preClearState !== 0) {
        nx = nx.withResidualStateAtLevel(this.toIndex, oldTopLevel, preClearState);
      }
      nx = nx.withStackPop(this.toIndex, this.level);
      // @java cs.remove maintains the count channel; clear it when the pop
      // empties the site (same fix as the sibling level-less branch below).
      if (nx.stackSize(this.toIndex) === 0 && nx.countAtSite(this.toIndex) > 0) {
        nx = nx.withCountAt(this.toIndex, 0);
      }
      const oti = nx.onTrackIndices;
      const loc = nx.trackLocToIndex;
      if (oti !== undefined && loc !== undefined && removedLevelWhat !== 0) {
        nx = nx.withOnTrackIndices(
          maintainOnTrackIndicesForRemove(oti, loc, removedLevelWhat, this.toIndex),
        );
      }
      return nx;
    }
    // @java ContainerStateStacks.java:694-711 — remove() pops only the TOP
    // stack level, unconditionally; there is no registry-presence gate. The
    // old `ownedEntries !== undefined` conjunct sent registry-less states to
    // the flat fallback below, which WIPED the whole site instead of popping
    // one level (Buffa de Baldrac ply 315: a 2-high pile lost both checkers
    // to a single hit). withOwnedRemoveLevel no-ops safely when the registry
    // is unmaterialized.
    //
    // A length-1 `stacks[]` entry is ambiguous the same way the explicit-level
    // branch above disambiguates it: a countAt-backed pile marker (mancala pit,
    // hand-entry pile) vs a genuine last piece of a real per-level stack. Gating
    // strictly on `> 1` sent the latter through the flat/countAt fallback below,
    // which clears cells/whats/countAt but never calls withStackPop — a stale
    // length-1 `stacks[]` entry survived underneath a reported-empty site. A
    // second same-site ActionRemove in the same Move (Ex Nihilo's `(remove (last
    // To) count:(size Stack at:(last To)))` draining a real 2-high stack) then
    // left that residual level for a following `(add … stack:True)` to push onto,
    // yielding a 2-high stack where Java's unconditional top-pop gives 1 (Ex
    // Nihilo MOVE_MISMATCH: a spurious `copy:True` candidate kept satisfying the
    // `(= (size Stack at:(last To)) (size Stack at:…))` guard it should have
    // failed, so the priority's real branch never got a chance to fire).
    //
    // The `toStackLen2===1 && !isCountPile2` disjunct is still ambiguous for a
    // FLAT (non-stacking) game: `state.stacks[site]` carries a length-1
    // "level 0" convenience entry for EVERY occupied site there too — not just
    // genuine per-level stacks — and a lone piece with no pile behind it
    // (countAt===1, e.g. At-Tab wa-d-Dukk's un-kinged Marker) fails the
    // `isCountPile2` test the same way a real single-level stack piece does.
    // That misrouted a flat game's ordinary single-piece capture through this
    // stacking-pop branch, which pops `stacks[]`/`countAt` but — unlike the
    // flat-clear branch below — never calls `withFlatOwnedRemove`, orphaning a
    // stale entry in `state.flatOwned` for the captured piece (At-Tab
    // MOVE_MISMATCH ply 267: the ghost entry produced a duplicated bogus
    // from/to candidate at the ghost's site, while Java's actual capturer had
    // no legal move and recorded a Pass). `state.stackingGame` is the same
    // `@java Game.java:946 isStacking()` / `GameType.Stacking` flag other
    // stacking/flat dispatch points in this file (line 197) and action-move.ts
    // already gate on — the faithful signal for "this container is really
    // ContainerStateStacks, not ContainerFlatState" — so require it here too.
    const toStackLen2 = state.stacks[this.toIndex]?.length ?? 0;
    const isCountPile2 = toStackLen2 === 1 && state.countAtSite(this.toIndex) > 1;
    if (state.stackingGame && (toStackLen2 > 1 || (toStackLen2 === 1 && !isCountPile2))) {
      const lvl = (state.stacks[this.toIndex]?.length ?? 1) - 1;
      const own = state.stackAt(this.toIndex, lvl);
      const wht = state.whatAtSiteLevel(this.toIndex, lvl);
      // Drop the removed piece from the per-state track-index structure
      // (Java ActionRemoveTopPiece onTrackIndices block, Core/src/other/action/
      // move/remove/ActionRemoveTopPiece.java) — this branch is the genuine
      // per-level real-stack pop (unlike its siblings above and below, which
      // already carry this call); omitting it here left a stale, never-
      // decremented ring-index entry for every removal that lands here (e.g.
      // a lone piece escaping/bearing off a track site with no countAt pile
      // behind it), corrupting `TrackSiteMove`'s internal-loop disambiguation
      // for any later piece sharing one of the track's duplicate sites.
      const removedLevelWhat2 = wht;
      const oti2 = state.onTrackIndices;
      const loc2 = state.trackLocToIndex;
      let nx = state.withOwnedRemoveLevel(own, wht, this.toIndex, lvl);
      nx = nx.withStackPop(this.toIndex);
      if (oti2 !== undefined && loc2 !== undefined && removedLevelWhat2 !== 0) {
        nx = nx.withOnTrackIndices(
          maintainOnTrackIndicesForRemove(oti2, loc2, removedLevelWhat2, this.toIndex),
        );
      }
      // @java ContainerStateStacks.java:693-712 — the level-less remove
      // zeroes state/rotation/VALUE at the vacated top slot, not just
      // who/what. withStackPop only splices per-level rows when they are
      // materialized; a stack:True game whose state came from ActionAdd's
      // scalar channel (Paintscape) never materializes them, so the flat
      // stateAt/valueAt scalars — the stateAtLevel/stateTop fallbacks —
      // survived removal and a relocated piece inherited the previous
      // occupant's state (spurious 6-matching-sites score @35/@39). No-op
      // for genuinely materialized per-level stacks.
      if (nx.stateAtSite(this.toIndex) !== 0) nx = nx.withStateAt(this.toIndex, 0);
      if (nx.valueAtSite(this.toIndex) !== 0) nx = nx.withValueAt(this.toIndex, 0);
      // @java ContainerStateStacks.java:693-712 / ContainerGraphStateStacks.
      // java:969-997 — the level-less remove() unconditionally calls
      // setState(state, 0) on the vacated physical chunk BEFORE decrementing
      // size, for both the Cell and Edge/Vertex overloads (unlike its
      // explicit-level sibling above, whose shift-loop leaves the OLD TOP's
      // `state` untouched and instead stashes it in `residualStateAt`). Any
      // shadow residual previously stashed at this exact physical depth
      // (`lvl`, the pre-pop top index) by an earlier explicit-level vacate is
      // therefore stale/moot in Java too — this level-less remove genuinely
      // overwrote that physical byte with 0 — and must be cleared here, else
      // a LATER hand-entry push landing on this same physical depth wrongly
      // resurfaces the older, now-superseded value instead of the fresh 0
      // Java's own unconditional setState left behind (Boolik RandomTrial_0
      // ply 131 / RandomTrial_1 ply 116: a CapturedPiece state=2 residual
      // stashed by an earlier `(remove … level:(level))` survived an
      // intervening clean level-less remove at the same physical depth and
      // falsely resurfaced under a later hand-entry push, wrongly keeping the
      // fresh arrival immobile and hiding a legal move Java actually has).
      if (nx.residualStateAtLevel(this.toIndex, lvl) !== 0) {
        nx = nx.withResidualStateAtLevel(this.toIndex, lvl, 0);
      }
      // @java cs.remove maintains the count channel; clear it when the pop
      // empties the site (see Game.apply flush note).
      if (nx.stackSize(this.toIndex) === 0 && nx.countAtSite(this.toIndex) > 0) {
        nx = nx.withCountAt(this.toIndex, 0);
      }
      return nx;
    }
    // The removed piece's component id, read before the site is cleared, so the
    // track-index structure can drop it (Java ActionRemoveTopPiece: `pieceIdx`).
    const removedWhat = state.whatAtSite(this.toIndex);
    // Removing from a multi-piece pile (Java: a stacked site, e.g. Bagh goat
    // stacks) leaves the remainder in place; only when the count is exhausted
    // does the site become empty. Plain single pieces (count 0/1) are cleared.
    // In a flat (non-stacking) game `clearAll` is set: `(remove)` wipes the
    // whole site (mancala pit clear), matching Java's ContainerFlatState.remove.
    // @java ContainerFlatState.remove (ContainerFlatState.java:740-747) —
    // setSite(site, 0,0,0,0,0,0): a FLAT remove clears the WHOLE site, count
    // included (T'oki's line capture wipes a 2-pile with ONE Remove). A
    // STACKING game's piles (Backgammon points, (place Stack count:N)) go
    // through ContainerStackingState instead: one piece per remove. Read the
    // pile size now — before any registry/flatOwned mutation below, neither of
    // which touches countAt — so it can also gate the registry-clear-vs-pop
    // choice immediately following.
    const pile = state.countAtSite(this.toIndex);
    const partialCountPileDecrement = state.stackingGame && pile > this.countValue;
    // Registry maintenance for the flat clear (@java owned().remove(owner,
    // pieceIdx, to, type) — level-less).
    if (state.ownedEntries !== undefined) {
      if (partialCountPileDecrement) {
        // @java ContainerStateStacks has no separate "count" channel — every
        // physical piece is its own registry level, so a level-less remove on
        // a count-backed pile (e.g. a tiger's `(remove (to))` capturing ONE
        // goat out of an 8-goat pile) still only pops ONE physical piece, not
        // the whole pile. `withOwnedSiteCleared` (the `else` arm below) is
        // only correct once the pile is fully drained; firing it unconditionally
        // wiped every still-live registered goat at the site even though
        // `pile - countValue` physically remained (countAt correctly dropped,
        // cells/what left untouched three lines below) — every later
        // `forEach Piece top:True` query then found nothing registered there
        // and the remaining goats became permanently unmovable (Bagh Bandi/
        // Bagh Batti/Bagh Guti/Bagha Guti/Sher Bakar MOVE_MISMATCH, the ply
        // right after each game's first capture). Remove exactly `countValue`
        // entries at level 0 (mirrors action-move.ts's stacking relocation
        // convention): `withOwnedRemoveLevel`'s built-in cascade shifts the
        // remaining same-site entries down by one each call, so the site
        // keeps exactly `pile - countValue` live entries, always with one
        // pinned at level 0 — the invariant context.ts's `sizeStack`
        // (deliberately flat=1 for these count-backed hunt/mancala families)
        // and the `top:True` filter both depend on.
        const owner = state.cellAt(this.toIndex).owner;
        let nx = state;
        for (let i = 0; i < this.countValue; i++) {
          nx = nx.withOwnedRemoveLevel(owner, removedWhat || owner, this.toIndex, 0);
        }
        state = nx;
      } else {
        state = state.withOwnedSiteCleared(this.toIndex);
      }
    }
    // @java Core/src/other/action/move/remove/ActionRemoveTopPiece.java:191-213
    // — owned().remove(owner, pieceIdx, to, type), a FlatCellOnlyOwned
    // remove-swap (FlatCellOnlyOwned.java:185-197). Keeps the flat registry
    // (see ActionMove's parity block) from going stale when a piece is
    // captured via an explicit Remove action rather than an overwriting
    // Move — e.g. a `(then (remove (to)))` capture sequence.
    if (state.flatOwned !== undefined) {
      const removedOwner = state.cellAt(this.toIndex).owner;
      if (removedOwner > 0) {
        state = state.withFlatOwnedRemove(removedOwner, removedWhat || removedOwner, this.toIndex);
      }
    }
    let next: State;
    if (partialCountPileDecrement) {
      next = state.withCountAt(this.toIndex, pile - this.countValue);
    } else {
      next = state.withCell(this.toIndex, 0).withWhatAt(this.toIndex, 0);
      if (pile > 0) next = next.withCountAt(this.toIndex, 0);
      // @java ContainerStateStacks.java:704-711 / ContainerFlatState.remove —
      // remove() clears EVERY channel: setWhat(0) setWho(0) setState(0)
      // setRotation(0) setValue(0). The TS clear left stale state/rotation/
      // value behind; a later placement at the site read the ghost attrs
      // (Paintscape @35: a repainted cell kept the removed piece's state).
      if (next.stateAtSite(this.toIndex) !== 0) next = next.withStateAt(this.toIndex, 0);
      if (next.valueAtSite(this.toIndex) !== 0) next = next.withValueAt(this.toIndex, 0);
      if ((next.rotationAt?.[this.toIndex] ?? 0) !== 0) {
        const withRot = (next as unknown as { withRotationAt?: (s: number, r: number) => State }).withRotationAt;
        if (withRot) next = withRot.call(next, this.toIndex, 0);
      }
    }
    // Drop the removed piece from the per-state track-index structure
    // (Java ActionRemoveTopPiece onTrackIndices block) — only for internal-loop
    // track games, where the structure is allocated. No-op everywhere else.
    const oti = next.onTrackIndices;
    const loc = next.trackLocToIndex;
    if (oti !== undefined && loc !== undefined && removedWhat !== 0) {
      next = next.withOnTrackIndices(
        maintainOnTrackIndicesForRemove(oti, loc, removedWhat, this.toIndex),
      );
    }
    return next;
  }

  public override actionType(): ActionType {
    return ActionRemove.TYPE;
  }

  public override to(): number {
    return this.toIndex;
  }

  // Java parity (ActionRemove.from() → `return to;`): a removal reports its
  // site as both from and to, so a `(move Remove (from))` Move surfaces
  // from()==to()==removed-site — letting trial replay tell a bear-off (e.g.
  // 12→12) apart from a same-destination relocation (10→12).
  public override from(): number {
    return this.toIndex;
  }

  public override count(): number {
    return this.countValue;
  }

  public override fromType(): SiteType {
    return this.siteType;
  }

  public override toType(): SiteType {
    return this.siteType;
  }

  public getLevel(): number {
    return this.level;
  }

  public setLevel(level: number): void {
    this.level = level;
  }
}
