// @java Core/src/other/action/move/remove/ActionRemoveTopPiece.java ActionRemoveTopPiece
/**
 * Java parity: Core/src/other/action/move/remove/ActionRemoveTopPiece.java
 * — remove only the top piece of a stack.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionRemoveTopPiece extends BaseAction {
  public static readonly TYPE: ActionType = "Remove";

  private readonly siteIndex: number;

  public constructor(siteIndex: number) {
    super();
    this.siteIndex = siteIndex;
  }

  public override apply(state: State): State {
    const stackSize = state.stackSize(this.siteIndex);
    if (stackSize > 0) return state.withStackPop(this.siteIndex);
    // Clear the component too: occupancy is what-based, so a stale `what`
    // would leave the emptied site reading as occupied (Java parity: the
    // container's empty-set is updated on removal).
    return state.withCell(this.siteIndex, 0).withWhatAt(this.siteIndex, 0);
  }
  public override actionType(): ActionType {
    return ActionRemoveTopPiece.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override isStacking(): boolean {
    return true;
  }
}
