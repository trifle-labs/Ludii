// @java Core/src/other/action/state/ActionSetCount.java ActionSetCount
/**
 * Java parity: Core/src/other/action/state/ActionSetCount.java.
 * Sets the count of pieces at a site.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetCountOptions {
  readonly to: number;
  readonly count: number;
}

export class ActionSetCount extends BaseAction {
  public static readonly TYPE: ActionType = "SetCount";

  private readonly toIndex: number;
  private readonly countValue: number;

  public constructor(options: ActionSetCountOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetCount.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.countValue = options.count;
  }

  public override apply(state: State): State {
    return state.withCountAt(this.toIndex, this.countValue);
  }

  public override actionType(): ActionType {
    return ActionSetCount.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override count(): number {
    return this.countValue;
  }
}
