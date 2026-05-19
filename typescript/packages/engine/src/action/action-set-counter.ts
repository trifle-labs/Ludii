/** Java parity: Core/src/other/action/state/ActionSetCounter.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetCounter extends BaseAction {
  public static readonly TYPE: ActionType = "SetCounter";

  private readonly counterValue: number;

  public constructor(value: number) {
    super();
    this.counterValue = value;
  }

  public override apply(state: State): State {
    return state.withCounter(this.counterValue);
  }
  public override actionType(): ActionType {
    return ActionSetCounter.TYPE;
  }
  public override value(): number {
    return this.counterValue;
  }
}
