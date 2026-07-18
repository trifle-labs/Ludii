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
    // pile. (remove X level:0) trims a full column's bottom (Complica). Gated on
    // a multi-piece stack so the default level-less remove is unchanged.
    if (this.level >= 0 && (state.stacks[this.toIndex]?.length ?? 0) > 1) {
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
      nx = nx.withStackPop(this.toIndex, this.level);
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
    if ((state.stacks[this.toIndex]?.length ?? 0) > 1) {
      const lvl = (state.stacks[this.toIndex]?.length ?? 1) - 1;
      const own = state.stackAt(this.toIndex, lvl);
      const wht = state.whatAtSiteLevel(this.toIndex, lvl);
      let nx = state.withOwnedRemoveLevel(own, wht, this.toIndex, lvl);
      nx = nx.withStackPop(this.toIndex);
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
    // Registry maintenance for the flat clear (@java owned().remove(owner,
    // pieceIdx, to, type) — level-less).
    if (state.ownedEntries !== undefined) {
      state = state.withOwnedSiteCleared(this.toIndex);
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
    // Removing from a multi-piece pile (Java: a stacked site, e.g. Bagh goat
    // stacks) leaves the remainder in place; only when the count is exhausted
    // does the site become empty. Plain single pieces (count 0/1) are cleared.
    // In a flat (non-stacking) game `clearAll` is set: `(remove)` wipes the
    // whole site (mancala pit clear), matching Java's ContainerFlatState.remove.
    // @java ContainerFlatState.remove (ContainerFlatState.java:740-747) —
    // setSite(site, 0,0,0,0,0,0): a FLAT remove clears the WHOLE site, count
    // included (T'oki's line capture wipes a 2-pile with ONE Remove). A
    // STACKING game's piles (Backgammon points, (place Stack count:N)) go
    // through ContainerStackingState instead: one piece per remove.
    const pile = state.countAtSite(this.toIndex);
    let next: State;
    if (state.stackingGame && pile > this.countValue) {
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
