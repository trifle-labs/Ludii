/** Java parity: Core/src/other/action/state/ActionSetPot.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetPot extends BaseAction {
  public static readonly TYPE: ActionType = "SetPot";

  private readonly potValue: number;

  public constructor(value: number) {
    super();
    this.potValue = value;
  }

  public override apply(state: State): State {
    return state.withPot(this.potValue);
  }
  public override actionType(): ActionType {
    return ActionSetPot.TYPE;
  }
  public override value(): number {
    return this.potValue;
  }
}
