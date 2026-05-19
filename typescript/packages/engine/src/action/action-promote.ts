/** Java parity: Core/src/other/action/move/ActionPromote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionPromote extends BaseAction {
  public static readonly TYPE: ActionType = "Promote";

  private readonly toIndex: number;
  private readonly whatValue: number;

  public constructor(to: number, what: number) {
    super();
    this.toIndex = to;
    this.whatValue = what;
  }

  public override apply(state: State): State {
    // Promotion replaces the piece at the target site.
    return state.withCell(this.toIndex, this.whatValue);
  }
  public override actionType(): ActionType {
    return ActionPromote.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override what(): number {
    return this.whatValue;
  }
}
