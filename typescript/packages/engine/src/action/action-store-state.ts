/** Java parity: Core/src/other/action/state/ActionStoreStateInContext.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionStoreStateInContext extends BaseAction {
  public static readonly TYPE: ActionType = "StoreState";

  public override apply(state: State): State {
    // The TS port doesn't yet carry an explicit "stored state slot" on
    // Context; this action is a no-op placeholder so .lud games that
    // declare (storeState) compile and apply.
    return state;
  }
  public override actionType(): ActionType {
    return ActionStoreStateInContext.TYPE;
  }
}
