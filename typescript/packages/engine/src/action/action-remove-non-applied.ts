/**
 * Java parity:
 * Core/src/other/action/move/remove/ActionRemoveNonApplied.java —
 * Marks a remove action that was generated but isn't currently applied
 * (used to keep the move history readable in branches that don't fire).
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionRemoveNonApplied extends BaseAction {
  public static readonly TYPE: ActionType = "Remove";

  private readonly siteIndex: number;

  public constructor(siteIndex: number) {
    super();
    this.siteIndex = siteIndex;
  }

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionRemoveNonApplied.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override isOtherMove(): boolean {
    return true;
  }
}
