// @java Core/src/other/action/puzzle/ActionReset.java ActionReset
/** Java parity: Core/src/other/action/puzzle/ActionReset.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionReset extends BaseAction {
  public static readonly TYPE: ActionType = "Reset";

  private readonly toIndex: number;

  public constructor(to: number) {
    super();
    this.toIndex = to;
  }

  public override apply(state: State): State {
    return state.withCell(this.toIndex, 0);
  }

  public override actionType(): ActionType {
    return ActionReset.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
}
