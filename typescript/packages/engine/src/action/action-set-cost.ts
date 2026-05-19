/** Java parity: Core/src/other/action/state/ActionSetCost.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetCost extends BaseAction {
  public static readonly TYPE: ActionType = "SetCost";

  private readonly toIndex: number;
  private readonly costValue: number;

  public constructor(to: number, cost: number) {
    super();
    this.toIndex = to;
    this.costValue = cost;
  }

  public override apply(state: State): State {
    // The MVE folds "cost" into the per-site value field.
    return state.withValueAt(this.toIndex, this.costValue);
  }
  public override actionType(): ActionType {
    return ActionSetCost.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override value(): number {
    return this.costValue;
  }
}
