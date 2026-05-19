/** Java parity: Core/src/other/action/die/ActionSetDiceAllEqual.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetDiceAllEqual extends BaseAction {
  public static readonly TYPE: ActionType = "SetDiceAllEqual";

  private readonly flag: boolean;

  public constructor(flag: boolean) {
    super();
    this.flag = flag;
  }

  public override apply(state: State): State {
    return state.withDiceAllEqual(this.flag);
  }
  public override actionType(): ActionType {
    return ActionSetDiceAllEqual.TYPE;
  }
  public override value(): number {
    return this.flag ? 1 : 0;
  }
}
