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
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError(`ActionAdd.to must be a non-negative integer.`);
    }
    if (!Number.isInteger(options.what) || options.what < 1) {
      throw new RangeError(
        `ActionAdd.what must be a positive integer (1-based owner).`,
      );
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
    if (this.onStack) {
      let next = state
        .withStackPush(this.toIndex, this.ownerIndex)
        .withWhatAt(this.toIndex, this.whatIndex);
      if (this.stateValue !== ACTION_OFF && this.stateValue !== ACTION_UNDEFINED) {
        next = next.withStateAt(this.toIndex, this.stateValue);
      }
      return next;
    }
    const currentWhat = state.whatAtSite(this.toIndex);
    const currentOwner = state.who(this.toIndex);
    if (currentWhat === this.whatIndex && currentOwner === this.ownerIndex) {
      const oldCount = state.countAtSite(this.toIndex) || 1;
      // Java parity: occupied ActionAdd sites accumulate count instead of
      // rewriting who/what (Core/src/other/action/move/ActionAdd.java:307-310).
      let next = state.withCountAt(this.toIndex, oldCount + this.countValue);
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
