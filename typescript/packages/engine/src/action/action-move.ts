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
  }

  public override apply(state: State): State {
    const movingOwner = state.cellAt(this.fromIndex).owner;
    if (movingOwner === 0) {
      throw new Error(
        `ActionMove.apply: source site ${this.fromIndex} is empty.`,
      );
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
    }
    return next.withCell(this.toIndex, movingOwner);
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
