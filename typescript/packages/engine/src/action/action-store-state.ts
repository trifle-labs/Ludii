// @java Core/src/other/action/state/ActionStoreStateInContext.java ActionStoreStateInContext
/** Java parity: Core/src/other/action/state/ActionStoreStateInContext.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionStoreStateInContext extends BaseAction {
  public static readonly TYPE: ActionType = "StoreState";

  public override apply(state: State): State {
    // Java parity: ActionStoreStateInContext.apply →
    // context.state().storeCurrentState(context.state()), recording the
    // current state's hash in the stored-state slot. Read by
    // (avoidStoredState …) to reject moves that reproduce this position.
    return state.storeCurrentState();
  }
  public override actionType(): ActionType {
    return ActionStoreStateInContext.TYPE;
  }
}
