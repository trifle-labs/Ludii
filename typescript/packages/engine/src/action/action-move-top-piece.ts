/**
 * Java parity: Core/src/other/action/move/move/ActionMoveTopPiece.java
 * — move only the piece on the top of a stack to another site.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionMoveTopPiece extends BaseAction {
  public static readonly TYPE: ActionType = "Move";

  private readonly fromIndex: number;
  private readonly toIndex: number;

  public constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    const stackSize = state.stackSize(this.fromIndex);
    if (stackSize === 0) {
      const owner = state.cells[this.fromIndex] ?? 0;
      if (owner === 0) return state;
      return state.withCell(this.fromIndex, 0).withCell(this.toIndex, owner);
    }
    const top = state.stackAt(this.fromIndex, stackSize - 1);
    return state.withStackPop(this.fromIndex).withStackPush(this.toIndex, top);
  }
  public override actionType(): ActionType {
    return ActionMoveTopPiece.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override isStacking(): boolean {
    return true;
  }
}
