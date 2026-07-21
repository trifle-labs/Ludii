// @java Core/src/other/action/state/ActionSetPending.java ActionSetPending
/** Java parity: Core/src/other/action/state/ActionSetPending.java. */

import type { State } from "../state.js";
import { ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetPending extends BaseAction {
  public static readonly TYPE: ActionType = "SetPending";

  /**
   * The potential pending value (Java ActionSetPending.value). Named
   * `pendingValue` (not `value`) because BaseAction already exposes a `value()`
   * method.
   */
  private readonly pendingValue: number;

  public constructor(value: number = ACTION_UNDEFINED) {
    super();
    this.pendingValue = value;
  }

  public override apply(state: State): State {
    // Java State.setPending(value): UNDEFINED (-1) is stored as 1; any other
    // value is stored as-is. It always *adds* to the pending set — it never
    // clears (clearing happens via rebootPending() at the turn boundary).
    const v = this.pendingValue === ACTION_UNDEFINED ? 1 : this.pendingValue;
    return state.withPendingAdd(v);
  }
  public override actionType(): ActionType {
    return ActionSetPending.TYPE;
  }
  // Java ActionSetPending.java does NOT override to()/from(); it inherits
  // BaseAction.to() = Constants.UNDEFINED (-1). An earlier TS override
  // returned the value, corrupting `(last To afterConsequence:True)`.
}
