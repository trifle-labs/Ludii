// @java Core/src/other/action/move/remove/ActionRemoveNonApplied.java ActionRemoveNonApplied
/**
 * Java parity:
 * Core/src/other/action/move/remove/ActionRemoveNonApplied.java —
 * the "remove later" action for sequence captures. Created by
 * `(remove … at:EndOfTurn)` (ActionRemove.construct with applied=false).
 * `apply` does NOT clear the piece; it marks the site in the state's
 * deferred-capture queue (`addSitesToRemove`). The piece therefore stays on
 * the board until the turn ends, when the move-apply store-path flushes the
 * queue and removes the pieces for real.
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
    return state.withSiteToRemove(this.siteIndex);
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
