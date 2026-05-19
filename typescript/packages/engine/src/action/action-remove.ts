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
}

export class ActionRemove extends BaseAction {
  public static readonly TYPE: ActionType = "Remove";

  private readonly toIndex: number;
  private readonly countValue: number;
  private level: number;
  private readonly siteType: SiteType;

  public constructor(options: ActionRemoveOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionRemove.to must be a non-negative integer.");
    }
    this.toIndex = options.to;
    this.countValue = options.count ?? 1;
    this.level = options.level ?? ACTION_UNDEFINED;
    this.siteType = options.type ?? "Cell";
  }

  public override apply(state: State): State {
    return state.withCell(this.toIndex, 0);
  }

  public override actionType(): ActionType {
    return ActionRemove.TYPE;
  }

  public override to(): number {
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
