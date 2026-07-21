// @java Core/src/other/action/others/ActionNextInstance.java ActionNextInstance
/** Java parity: Core/src/other/action/others/ActionNextInstance.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

/**
 * Mark a transition to the next sub-game instance (Match games). The TS
 * MVE doesn't model Match games yet; we keep the action shape so it can
 * be emitted without breaking move bookkeeping.
 */
export class ActionNextInstance extends BaseAction {
  public static readonly TYPE: ActionType = "NextInstance";

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionNextInstance.TYPE;
  }
  public override containsNextInstance(): boolean {
    return true;
  }
}
