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
    this.clearAll = options.clearAll ?? false;
  }

  public override apply(state: State): State {
    // The removed piece's component id, read before the site is cleared, so the
    // track-index structure can drop it (Java ActionRemoveTopPiece: `pieceIdx`).
    const removedWhat = state.whatAtSite(this.toIndex);
    // Removing from a multi-piece pile (Java: a stacked site, e.g. Bagh goat
    // stacks) leaves the remainder in place; only when the count is exhausted
    // does the site become empty. Plain single pieces (count 0/1) are cleared.
    // In a flat (non-stacking) game `clearAll` is set: `(remove)` wipes the
    // whole site (mancala pit clear), matching Java's ContainerFlatState.remove.
    const pile = state.countAtSite(this.toIndex);
    let next: State;
    if (!this.clearAll && pile > this.countValue) {
      next = state.withCountAt(this.toIndex, pile - this.countValue);
    } else {
      next = state.withCell(this.toIndex, 0).withWhatAt(this.toIndex, 0);
      if (pile > 0) next = next.withCountAt(this.toIndex, 0);
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
