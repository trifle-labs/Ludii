// @java Core/src/other/action/others/ActionPass.java ActionPass
/**
 * Java parity:
 * - Core/src/other/action/others/ActionPass.java — the "skip your turn"
 *   action. Apply is a no-op; the surrounding Game.apply() is what
 *   actually advances the mover and may trigger an end condition.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionPass extends BaseAction {
  public static readonly TYPE: ActionType = "Pass";

  public override apply(state: State): State {
    return state;
  }

  public override actionType(): ActionType {
    return ActionPass.TYPE;
  }

  public override isPass(): boolean {
    return true;
  }

  public override isAlwaysGUILegal(): boolean {
    return true;
  }
}
