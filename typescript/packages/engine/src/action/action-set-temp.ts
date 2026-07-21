// @java Core/src/other/action/state/ActionSetTemp.java ActionSetTemp
/**
 * Java parity: Core/src/other/action/state/ActionSetTemp.java.
 * Java's constructor takes ONLY the temp value (no player) — State.tempValue
 * is a single global slot (State.java:83), default Constants.UNDEFINED.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetTemp extends BaseAction {
  public static readonly TYPE: ActionType = "SetTemp";

  private readonly tempValue: number;

  /** @java ActionSetTemp(final int temp) */
  public constructor(value: number) {
    super();
    this.tempValue = value;
  }

  /** @java ActionSetTemp.apply — context.state().setTemp(temp) */
  public override apply(state: State): State {
    return state.withTemp(this.tempValue);
  }
  public override actionType(): ActionType {
    return ActionSetTemp.TYPE;
  }
  public override value(): number {
    return this.tempValue;
  }
}
