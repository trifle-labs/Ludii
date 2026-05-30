// @java Core/src/other/action/move/move/ActionMove.java ActionMove
// @java Core/src/other/action/move/ActionMoveN.java ActionMoveN
/**
 * Java parity:
 * - Core/src/other/action/move/ActionMoveN.java — the "move N pieces
 *   from one site to another" action. (The Java class hierarchy splits
 *   single-piece vs N-piece moves; for the MVE one class handles both
 *   with count=1 as the common case.)
 *
 * Subset ported: deterministic data members (from / to / count /
 * state / rotation / value / level{From,To}) plus the core
 * `apply(state) → state` semantics: the piece at `from` is cleared
 * and re-placed at `to`. Hidden info, stacking semantics, and per-die
 * dispatch are deferred.
 */

import { maintainOnTrackIndicesForMove } from "../on-track-indices.js";
import type { State } from "../state.js";
import { ACTION_OFF, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

export interface ActionMoveOptions {
  readonly from: number;
  readonly to: number;
  readonly count?: number;
  readonly state?: number;
  readonly rotation?: number;
  readonly value?: number;
  readonly fromType?: SiteType;
  readonly toType?: SiteType;
  /**
   * Non-stacking N-seed transfer (Java `ActionMoveN`, FromTo.java 348). When
   * set, `apply` moves `count` seeds from→to by adjusting the per-site counts
   * (mancala model) instead of relocating a single piece. The resulting state
   * is identical to applying two `ActionAddCount`s (−count at `from`, +count at
   * `to`), but a single action keeps `from()`/`to()`/`count()` reporting intact
   * so the move's decision action is matched correctly.
   */
  readonly transferCount?: boolean;
  /** Owner stamped on occupied sites in `transferCount` mode (the seed owner). */
  readonly seedOwner?: number;
  /**
   * Extra cells the relocated large piece covers at `to` beyond the anchor
   * (Java: `ActionMove` + `applyLargePiece`). When set, `apply` clears the
   * single-cell source (a hand site) and lays the piece's whole footprint at
   * `to`, writing the rotation `state` on the anchor — used by from-hand
   * large-piece placement (Pentomino) and board-to-board relocation (L Game).
   */
  readonly footprint?: readonly number[];
  /**
   * Cells the relocated large piece currently covers at `from` and must vacate
   * (Java: the old `Component.locs` cleared before `applyLargePiece` re-lays the
   * new footprint). Used for board-to-board relocation where the piece spans
   * several cells; absent ⇒ only the single `from` cell is cleared (from-hand).
   * The new footprint may legitimately re-cover some of these (self-overlap),
   * so clearing happens before the new footprint is laid.
   */
  readonly clearFootprint?: readonly number[];
}

export class ActionMove extends BaseAction {
  public static readonly TYPE: ActionType = "Move";

  private readonly fromIndex: number;
  private readonly toIndex: number;
  private readonly countValue: number;
  private readonly stateValue: number;
  private readonly rotationValue: number;
  private readonly valueValue: number;
  private readonly siteTypeFrom: SiteType;
  private readonly siteTypeTo: SiteType;
  private readonly transferCount: boolean;
  private readonly seedOwnerValue: number;
  private readonly footprint: readonly number[];
  private readonly clearFootprint: readonly number[];

  public constructor(options: ActionMoveOptions) {
    super();
    if (!Number.isInteger(options.from) || options.from < 0) {
      throw new RangeError("ActionMove.from must be a non-negative integer.");
    }
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionMove.to must be a non-negative integer.");
    }
    this.fromIndex = options.from;
    this.toIndex = options.to;
    this.countValue = options.count ?? 1;
    this.stateValue = options.state ?? ACTION_OFF;
    this.rotationValue = options.rotation ?? ACTION_OFF;
    this.valueValue = options.value ?? ACTION_OFF;
    this.siteTypeFrom = options.fromType ?? "Cell";
    this.siteTypeTo = options.toType ?? options.fromType ?? "Cell";
    this.transferCount = options.transferCount ?? false;
    this.seedOwnerValue = options.seedOwner ?? 0;
    this.footprint = options.footprint ?? [];
    this.clearFootprint = options.clearFootprint ?? [];
  }

  public override apply(state: State): State {
    if (this.footprint.length > 0 || this.clearFootprint.length > 0) {
      // Large-piece relocation (Java: ActionMove → applyLargePiece). Read the
      // piece off its anchor, vacate every cell it currently covers, then lay
      // the whole new footprint at `to`: the anchor carries what/who/state and
      // the remaining covered cells are marked occupied so they leave
      // (sites Empty). A from-hand placement (Pentomino) has no old footprint —
      // only the single `from` source is cleared; a board-to-board move
      // (L Game) clears the piece's full current footprint, which the new one
      // may legitimately re-cover (self-overlap), so clearing precedes laying.
      const movingWhat = state.whatAtSite(this.fromIndex);
      const movingOwner = state.cellAt(this.fromIndex).owner || movingWhat;
      if (movingWhat === 0 && movingOwner === 0) return state;
      let next = state;
      const toClear =
        this.clearFootprint.length > 0 ? this.clearFootprint : [this.fromIndex];
      for (const loc of toClear) {
        if (loc < 0) continue;
        next = next.withCell(loc, 0).withWhatAt(loc, 0);
        if (next.countAtSite(loc) > 0) next = next.withCountAt(loc, 0);
      }
      // The anchor carries who/what/state; every covered cell (anchor included)
      // gets count=1 with no owner — Java applyLargePiece (removeFromEmpty +
      // setCount), matching the from-hand ActionAdd footprint exactly.
      next = next.withCell(this.toIndex, movingOwner).withWhatAt(this.toIndex, movingWhat);
      if (this.stateValue !== ACTION_OFF) {
        next = next.withStateAt(this.toIndex, this.stateValue);
      }
      for (const loc of this.footprint) {
        if (loc >= 0) next = next.withCountAt(loc, 1);
      }
      return next;
    }
    if (this.transferCount) {
      // Non-stacking N-seed transfer (Java ActionMoveN). Mirrors exactly the
      // pair of ActionAddCounts (−count at from, +count at to): adjust each
      // site's seed count and keep `cells` occupancy in sync with the seed
      // owner, leaving `whatAt` untouched (the mancala model never sets it).
      const n = this.countValue;
      let s = state;
      const fromNew = Math.max(0, s.countAtSite(this.fromIndex) - n);
      s = s.withCountAt(this.fromIndex, fromNew);
      const fromOwner = fromNew > 0 ? this.seedOwnerValue : 0;
      if ((s.cells[this.fromIndex] ?? 0) !== fromOwner) {
        s = s.withCell(this.fromIndex, fromOwner);
      }
      const toNew = Math.max(0, s.countAtSite(this.toIndex) + n);
      s = s.withCountAt(this.toIndex, toNew);
      const toOwner = toNew > 0 ? this.seedOwnerValue : 0;
      if ((s.cells[this.toIndex] ?? 0) !== toOwner) {
        s = s.withCell(this.toIndex, toOwner);
      }
      return s;
    }
    // Genuine per-level stack at the source — a distinct-piece stack (Tower of
    // Hanoi disks, snakes-and-ladders pawn piles) seeded by `(place Stack
    // items:{…})` or built up by stacking pushes, recognised by a non-empty
    // per-level `what` column. Java's stacking ActionMove relocates the TOP
    // piece: pop it off `from` (exposing the piece beneath) and push it onto
    // `to`, carrying its component so a buried disk keeps its own `what`. The
    // flat branch below would instead wipe the whole source cell, losing the
    // pieces underneath. Only distinct-piece-stack games ever populate
    // `whatStacks`, so every other game falls straight through.
    // Either endpoint carrying a per-level `what` column marks this as a
    // distinct-piece-stack move. Gating on the destination too is essential: the
    // single piece whose component id equals its owner (Tower of Hanoi's
    // smallest disk) leaves `whatStacks` unmaterialised at its own site, but
    // landing it onto a real stack must still push a level rather than fall into
    // the flat same-owner `countAt` merge below (which would absorb it into a
    // pile count and erase the buried pieces' identities).
    const fromWhatStack = state.whatStacks[this.fromIndex];
    const toWhatStack = state.whatStacks[this.toIndex];
    if (
      this.fromIndex !== this.toIndex &&
      ((fromWhatStack !== undefined && fromWhatStack.length > 0) ||
        (toWhatStack !== undefined && toWhatStack.length > 0))
    ) {
      const topLevel = state.stackSize(this.fromIndex) - 1;
      const topOwner = state.stackAt(this.fromIndex, topLevel);
      const topWhat = state.whatAtSiteLevel(this.fromIndex, topLevel);
      if (topOwner === 0) return state;
      const popped = state.withStackPop(this.fromIndex);
      const pushed = popped.withStackPush(this.toIndex, topOwner, topWhat);
      return this.maintainTracks(pushed, topWhat);
    }
    const movingOwner = state.cellAt(this.fromIndex).owner;
    // Preserve the moving piece's component identity (Java: ContainerState
    // carries `what` with the piece, not just its owner). Read it before the
    // source site is cleared.
    const movingWhat = state.whatAtSite(this.fromIndex);
    // The piece's stored state, rotation and value all travel with it (Java
    // ActionMoveTopPiece lines 399-419): for each, an explicit value on the
    // move wins, otherwise the source site's current value is carried to the
    // destination. (Quarto encodes a piece's 3rd attribute as the local site
    // state and its 4th as the value; its win rules read `(state at:(to))` and
    // `(value Piece at:(to))`.) Read all three before the source is cleared.
    const currentStateFrom = state.stateAtSite(this.fromIndex);
    const currentRotationFrom = state.rotationAtSite(this.fromIndex);
    const currentValueFrom = state.valueAtSite(this.fromIndex);
    const destState =
      this.stateValue !== ACTION_OFF ? this.stateValue : currentStateFrom;
    const destRotation =
      this.rotationValue !== ACTION_OFF ? this.rotationValue : currentRotationFrom;
    const destValue =
      this.valueValue !== ACTION_OFF ? this.valueValue : currentValueFrom;
    // Java parity (ActionMoveTopPiece.apply, non-stacking branch): "If the
    // origin is empty we do not apply this action" → `return this;`. An empty
    // source is a silent no-op, not an error. This arises when a hypothetical
    // move (e.g. a `(then …)`/constraint filter's applyHypothetical) references
    // a site already vacated by a prior action in the same sequence.
    if (movingOwner === 0 && movingWhat === 0) {
      return state;
    }
    // When the source carries a stacked count — e.g. a hand seeded with
    // `(place … "Hand" count:N)` from which pieces are placed one at a time —
    // move a single piece out and leave the rest, so the site stays occupied
    // until exhausted. A plain piece (count 0 or 1) is cleared as before.
    const fromCount = state.countAtSite(this.fromIndex);
    let next = state;
    if (fromCount > 1) {
      next = next.withCountAt(this.fromIndex, fromCount - 1);
    } else {
      next = next.withCell(this.fromIndex, 0);
      if (fromCount === 1) next = next.withCountAt(this.fromIndex, 0);
      next = next.withWhatAt(this.fromIndex, 0);
      // Java `csFrom.remove` resets the vacated site's state/rotation/value.
      if (currentStateFrom !== 0) next = next.withStateAt(this.fromIndex, 0);
      if (currentRotationFrom !== 0) next = next.withRotationAt(this.fromIndex, 0);
      if (currentValueFrom !== 0) next = next.withValueAt(this.fromIndex, 0);
    }
    // Stacking onto an occupied destination owned by the same player (Java:
    // ContainerStateStacks.addItem). Backgammon-family points hold a pile of
    // same-owner pieces tracked in `countAt`; a piece landing on a friendly
    // point raises the pile height by one. A non-stacking game never moves
    // onto its own piece, so this branch is inert there; landing on an enemy
    // (different owner) overwrites it, as before (capture-by-replacement).
    // The owner must be a real player: a *neutral* piece (owner 0) moving to an
    // empty cell (cells == 0) would otherwise spuriously match `0 === 0` and
    // "stack" onto the empty square (L Game's Dots), corrupting the count.
    if (
      this.fromIndex !== this.toIndex &&
      movingOwner !== 0 &&
      (state.cells[this.toIndex] ?? 0) === movingOwner
    ) {
      const destHeight = Math.max(state.countAtSite(this.toIndex), 1);
      next = next.withCell(this.toIndex, movingOwner);
      next = next.withWhatAt(this.toIndex, movingWhat);
      next = this.applyDestAttrs(next, destState, destRotation, destValue);
      next = next.withCountAt(this.toIndex, destHeight + 1);
      return this.maintainTracks(next, movingWhat);
    }
    next = next.withCell(this.toIndex, movingOwner);
    next = next.withWhatAt(this.toIndex, movingWhat);
    next = this.applyDestAttrs(next, destState, destRotation, destValue);
    return this.maintainTracks(next, movingWhat);
  }

  /**
   * Advance the moved piece's recorded track index (Java ActionMoveN.apply
   * 297-340). A no-op unless the game allocated `onTrackIndices` (internal-loop
   * track family) and a real piece (`what != 0`) moved — exactly Java's
   * `if (what != 0 && onTrackIndices != null)` guard. The large-piece and
   * `transferCount` (mancala N-seed) branches never reach here: large-piece
   * games have no tracks, and mancala tracks are full loops (not internal
   * loops) so `onTrackIndices` is absent there.
   */
  private maintainTracks(next: State, movingWhat: number): State {
    const oti = next.onTrackIndices;
    const loc = next.trackLocToIndex;
    if (oti === undefined || loc === undefined || movingWhat === 0) return next;
    const updated = maintainOnTrackIndicesForMove(
      oti,
      loc,
      movingWhat,
      this.countValue,
      this.fromIndex,
      this.toIndex,
    );
    return next.withOnTrackIndices(updated);
  }

  /** Write the destination site's state/rotation/value, skipping no-op writes
   * (Java ActionMoveTopPiece sets each via `csTo.setSite`). */
  private applyDestAttrs(
    next: State,
    destState: number,
    destRotation: number,
    destValue: number,
  ): State {
    if (destState !== next.stateAtSite(this.toIndex)) {
      next = next.withStateAt(this.toIndex, destState);
    }
    if (destRotation !== next.rotationAtSite(this.toIndex)) {
      next = next.withRotationAt(this.toIndex, destRotation);
    }
    if (destValue !== next.valueAtSite(this.toIndex)) {
      next = next.withValueAt(this.toIndex, destValue);
    }
    return next;
  }

  public override actionType(): ActionType {
    return ActionMove.TYPE;
  }

  public override from(): number {
    return this.fromIndex;
  }

  public override to(): number {
    return this.toIndex;
  }

  public override count(): number {
    return this.countValue;
  }

  public override state(): number {
    return this.stateValue;
  }

  public override rotation(): number {
    return this.rotationValue;
  }

  public override value(): number {
    return this.valueValue;
  }

  public override fromType(): SiteType {
    return this.siteTypeFrom;
  }

  public override toType(): SiteType {
    return this.siteTypeTo;
  }
}
