/**
 * Java parity: `ActionType.Noop` enum member — no dedicated class in
 * Java; the engine constructs `Noop` actions from various places. We
 * provide a class for parity so the TS side can emit and inspect them.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionNoop extends BaseAction {
  public static readonly TYPE: ActionType = "Noop";

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionNoop.TYPE;
  }
}
