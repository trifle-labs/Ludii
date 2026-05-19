/** Java parity: Core/src/other/action/state/ActionSetPending.java. */

import type { State } from "../state.js";
import { ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetPending extends BaseAction {
  public static readonly TYPE: ActionType = "SetPending";

  private readonly siteIndex: number;

  public constructor(siteIndex: number = ACTION_UNDEFINED) {
    super();
    this.siteIndex = siteIndex;
  }

  public override apply(state: State): State {
    if (this.siteIndex < 0) return state.withPendingClear();
    return state.withPendingAdd(this.siteIndex);
  }
  public override actionType(): ActionType {
    return ActionSetPending.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
}
