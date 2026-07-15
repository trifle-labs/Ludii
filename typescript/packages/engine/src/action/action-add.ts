// @java Core/src/other/action/move/ActionAdd.java ActionAdd
/**
 * Java parity:
 * - Core/src/other/action/move/ActionAdd.java — the "add one or more
 *   pieces to a site" action.
 *
 * Subset ported: deterministic data members (to / what / state /
 * rotation / value / count / onStack / level) plus the core
 * `apply(state) → state` semantics. The hidden-information bookkeeping
 * (`previousHidden*` fields and the per-player visibility arrays) is
 * deferred because no game in the MVE corpus uses it; once Trial
 * undo lands, those fields can be filled in.
 */

import type { State } from "../state.js";
import { ACTION_OFF, ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

export interface ActionAddOptions {
  /** Target site index. */
  readonly to: number;
  /** Component index to place (Java: ContainerState.what). */
  readonly what: number;
  /**
   * Owner index to record at the site (Java: ContainerState.who). Defaults to
   * `what` for the common single-component-per-player case; heterogeneous-piece
   * games (chess) pass a distinct component id as `what` and the player as
   * `owner`.
   */
  readonly owner?: number;
  /** Repeat count. Defaults to 1. */
  readonly count?: number;
  readonly state?: number;
  readonly rotation?: number;
  readonly value?: number;
  readonly onStack?: boolean;
  readonly type?: SiteType;
  /**
   * Extra cells a large piece covers beyond {@link to} (the anchor). Java's
   * `ActionAdd.applyLargePiece` walks `Component.locs` and, for every covered
   * cell, calls `cs.removeFromEmpty(loc)` + `cs.setCount(loc, 1)` — the cells
   * leave the empty set so no later placement overlaps, but their who/what stay
   * 0 (only the anchor carries the piece). We mirror that exactly: each covered
   * cell (anchor included) gets `count = 1` and no owner, so count-aware
   * `isOccupiedSite` keeps them out of `(sites Empty)` while owner-filtered
   * `(sites Occupied by:…)` does not treat the body as separate pieces. Absent
   * ⇒ ordinary single-cell.
   */
  readonly footprint?: readonly number[];
}

export class ActionAdd extends BaseAction {
  public static readonly TYPE: ActionType = "Add";

  private readonly toIndex: number;
  private readonly whatIndex: number;
  private readonly ownerIndex: number;
  private readonly countValue: number;
  private readonly stateValue: number;
  private readonly rotationValue: number;
  private readonly valueValue: number;
  private readonly onStack: boolean;
  private readonly siteType: SiteType;
  private readonly footprint: readonly number[];
  /** Defaults to Constants.UNDEFINED on the Java side. */
  private level: number = ACTION_UNDEFINED;

  public constructor(options: ActionAddOptions) {
    super();
    // @java ActionAdd.java — Java actions never validate in the constructor;
    // a generation-time Add with what<=0 or to<0 (Loop Xiangqi probes piece
    // ids before any capture exists) applies as a no-op instead of throwing.
    if (!Number.isInteger(options.to)) {
      throw new RangeError(`ActionAdd.to must be an integer.`);
    }
    this.toIndex = options.to;
    this.whatIndex = options.what;
    this.ownerIndex = options.owner ?? options.what;
    this.countValue = options.count ?? 1;
    this.stateValue = options.state ?? ACTION_OFF;
    this.rotationValue = options.rotation ?? ACTION_OFF;
    this.valueValue = options.value ?? ACTION_OFF;
    this.onStack = options.onStack ?? false;
    this.siteType = options.type ?? "Cell";
    this.footprint = options.footprint ?? [];
  }

  public override apply(state: State): State {
    if (this.toIndex < 0 || this.whatIndex < 1) return state;
    // @java ActionAdd.apply — when the target is a non-default graph element
    // (Edge/Vertex), Java writes that element's ContainerState (a distinct
    // occupancy layer from Cell). The live TS State tracks Edge/Vertex
    // occupancy in the typedSites channel; write who/what/count there and skip
    // the cells/whats arrays entirely so the two layers never collide (edge
    // index 9 and cell index 9 are independent sites).
    if (this.siteType !== "Cell") {
      const curWho = state.whoTyped(this.siteType, this.toIndex);
      const curWhat = state.whatTyped(this.siteType, this.toIndex);
      if (curWhat === this.whatIndex && curWho === this.ownerIndex) {
        // @java occupied-site accumulate (requiresCount) vs force-1 (see the
        // Cell branch below for the reasoning behind the requiresCount gate).
        const oldCount = state.countTyped(this.siteType, this.toIndex);
        return state.withTypedSite(
          this.siteType, this.toIndex, this.ownerIndex, this.whatIndex,
          state.requiresCountGame ? oldCount + this.countValue : 1,
        );
      }
      return state.withTypedSite(
        this.siteType, this.toIndex, this.ownerIndex, this.whatIndex,
        Math.max(this.countValue, 1),
      );
    }
    // @java ActionAdd.java:200,284 — requiresStack = game.isStacking(): the
    // stacking-push path is gated on the GAME's flag, not the per-action
    // stack marker. A plain (non stack:true) Add in a stacking game still
    // pushes a level (Pahada Keliya's centre-site double-capture placed via
    // a plain Add silently overwrote the existing occupant).
    if (this.onStack || state.stackingGame) {
      // @java ActionAdd (stacking) calls cs.addItemGeneric(state, to, what, who, …),
      // pushing the COMPONENT and the OWNER into their parallel stack columns in
      // one call. Passing `whatIndex` to withStackPush materializes whatStacks[to]
      // with the component id; omitting it (the old code) back-filled the column
      // with the OWNER number instead, so a heterogeneous `(place Stack items:{…})`
      // start (Gyan Chaupar / Es-Sig / Set Dilth' / Siga: Pawn1..4 with distinct
      // component ids per player) left whatStacks holding owner numbers — once the
      // upper pieces were popped, (forEach Piece) could not identify the remaining
      // piece by component and generated no move (forced pass). withStackPush sets
      // whats[to] from `what` too, so the separate withWhatAt is redundant.
      let next = state.withStackPush(this.toIndex, this.ownerIndex, this.whatIndex);
      // @java ActionAdd (stacking): owned().add at the new top level.
      next = next.withOwnedAdd(this.ownerIndex, this.whatIndex, this.toIndex, next.stackSize(this.toIndex) - 1);
      if (this.stateValue !== ACTION_OFF && this.stateValue !== ACTION_UNDEFINED) {
        next = next.withStateAt(this.toIndex, this.stateValue);
      }
      return next;
    }
    const currentWhat = state.whatAtSite(this.toIndex);
    // @java ActionAdd.java:287-315 — the branch discriminant is simply
    // `currentWhat == 0`: ANY add onto an occupied site takes the else branch
    // (setSite with UNDEFINED who/what — the EXISTING owner/piece stay
    // untouched; only count/state/rotation/value update). The old TS
    // condition (same what AND same owner) let a DIFFERENT player's re-claim
    // fall through and OVERWRITE the owner (Pula's first-claim-wins rule
    // broke: a later claim flipped the cell, WINNER_MISMATCH @77).
    if (currentWhat !== 0) {
      // @java ActionAdd.java:310 — occupied sites accumulate: setSite(.., UNDEFINED,
      //   UNDEFINED, requiresCount ? oldCount + count : 1, ..). The old `|| 1`
      // coerced a real oldCount of 0 into 1, fabricating a seed when a mancala
      // empty-pit capture `(add piece (to (handSite Shared)) count:(count at:site))`
      // re-adds with count=0 (oldCount 0 + 0 should stay 0, not become 1). Use the
      // raw oldCount: 0+0=0 (empty-pit), 4+4=8 (normal sow), 0+1=1 (flat re-add,
      // matching Java's non-requiresCount `: 1` branch since count defaults to 1).
      const oldCount = state.countAtSite(this.toIndex);
      // @java ActionAdd.java:310 — `game.requiresCount() ? oldCount + count : 1`.
      // Without the Count flag a re-Add to an occupied site FORCES count to 1:
      // Spinimax's per-move auto-fill re-Adds every already-filled platform
      // site each turn, so the accumulating branch inflated counts (1→2→…→18)
      // and `(count Pieces …) = 30` never fired (draw instead of the recorded
      // win). Count-bearing games (sow/handSite/(count at:)/count:>1 anywhere)
      // keep the accumulate path — including its 0+0=0 empty-pit case.
      let next = state.withCountAt(
        this.toIndex,
        state.requiresCountGame ? oldCount + this.countValue : 1,
      );
      if (this.stateValue !== ACTION_OFF && this.stateValue !== ACTION_UNDEFINED) {
        next = next.withStateAt(this.toIndex, this.stateValue);
      }
      return next;
    }
    // Java parity: ActionAdd.apply → cs.setSite(.., who, what, count, state,
    // rotation, value, ..) writes all fields alongside who/what
    // (ActionAdd.java:292). The TS port previously omitted rotation and value,
    // leaving placed pieces with rotation=0 even when rotation: was specified.
    let next = state
      .withCell(this.toIndex, this.ownerIndex)
      .withWhatAt(this.toIndex, this.whatIndex);
    // @java ActionAdd.java:292 — cs.setSite writes `count` alongside who/what.
    // The new-piece path omitted it, so (add (piece …) (to …) count:N) left
    // countAt=0 and (count Cell at:site)/(is Occupied) read 0 (Azteka's reset
    // re-deals count:14 to a just-cleared hand; HandOccupied stayed false ->
    // only a pass). Guarded on >1 so flat single-piece adds are unchanged.
    // @java ActionAdd.java:292 setSite ALWAYS writes count — in a
    // requiresCount() game a fresh single add must stamp countAt=1, or the
    // pile bookkeeping drifts: Shogi's first capture-to-hand left count=0,
    // the second add then accumulated 0+1=1, and the recorded SECOND pawn
    // drop from the hand found it empty. Non-count games keep the >1 guard
    // (flat single-piece adds stay countAt=0, Spinimax's re-adds unchanged).
    if (this.countValue > 1 || (state.requiresCountGame && this.countValue >= 1)) {
      next = next.withCountAt(this.toIndex, this.countValue);
    }
    if (this.stateValue !== ACTION_OFF && this.stateValue !== ACTION_UNDEFINED) {
      next = next.withStateAt(this.toIndex, this.stateValue);
    }
    // @java Core/src/other/action/move/ActionAdd.java:292 — cs.setSite includes
    // rotation; set it on placement so pieces start with the declared rotation.
    if (this.rotationValue !== ACTION_OFF && this.rotationValue !== ACTION_UNDEFINED) {
      next = next.withRotationAt(this.toIndex, this.rotationValue);
    }
    // Large-piece footprint: every covered cell (anchor included) gets count=1
    // and no owner, matching Java applyLargePiece (removeFromEmpty + setCount).
    // The count keeps the cell out of `(sites Empty)`; the absent owner keeps
    // the body out of owner-filtered `(sites Occupied by:…)`.
    if (this.footprint.length > 0) {
      for (const loc of this.footprint) {
        if (loc >= 0) next = next.withCountAt(loc, 1);
      }
    }
    return next;
  }

  public override actionType(): ActionType {
    return ActionAdd.TYPE;
  }

  public override from(): number {
    // Java parity: ActionAdd.from() returns `to` (Core/.../ActionAdd.java:734).
    // A placement move reports from()==to()==site, not OFF.
    return this.toIndex;
  }

  public override to(): number {
    return this.toIndex;
  }

  public override what(): number {
    return this.whatIndex;
  }

  public override who(): number {
    return this.ownerIndex;
  }

  public override count(): number {
    return this.countValue;
  }

  public override state(): number {
    return this.stateValue === ACTION_OFF || this.stateValue === ACTION_UNDEFINED
      ? this.whatIndex
      : this.stateValue;
  }

  public override rotation(): number {
    return this.rotationValue;
  }

  public override value(): number {
    return this.valueValue;
  }

  public override isStacking(): boolean {
    return this.onStack;
  }

  public override fromType(): SiteType {
    return this.siteType;
  }

  public override toType(): SiteType {
    return this.siteType;
  }

  /** Java parity: `getLevel()`. Returns `-1` until set. */
  public getLevel(): number {
    return this.level;
  }

  public setLevel(level: number): void {
    this.level = level;
  }
}
