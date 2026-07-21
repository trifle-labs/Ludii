// @java Core/src/other/action/move/ActionSelect.java ActionSelect
/** Java parity: Core/src/other/action/move/ActionSelect.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSelect extends BaseAction {
  public static readonly TYPE: ActionType = "Select";

  private readonly fromIndex: number;
  private readonly toIndex: number;

  public constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    // Select is a decision-marker; no state mutation here. The hosting
    // Move's `then`-chain provides the actual effect.
    return state;
  }
  public override actionType(): ActionType {
    return ActionSelect.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
}
