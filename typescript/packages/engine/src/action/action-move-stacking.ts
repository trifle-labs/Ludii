// @java Core/src/other/action/move/move/ActionMoveStacking.java ActionMoveStacking
/**
 * Java parity: Core/src/other/action/move/move/ActionMoveStacking.java —
 * move a piece from one site to another, stacking on top of the
 * destination contents.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionMoveStacking extends BaseAction {
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
    // Get the top-level owner. If stacks[from] is not yet materialized (empty array)
    // but the site is occupied (cells[from] > 0), fall back to cells[from].
    // @java ActionMoveStacking.apply: relocates the TOP piece of the source stack.
    const stackTop = stackSize > 0 ? state.stackAt(this.fromIndex, stackSize - 1) : 0;
    const piece = stackTop > 0 ? stackTop : state.who(this.fromIndex);
    if (piece === 0) return state;
    // Pop the top from source: if stacks array is non-empty use withStackPop,
    // else just clear the cell (non-materialized single piece).
    const sourceStack = state.stacks[this.fromIndex];
    const hasMaterializedStack = sourceStack !== undefined && sourceStack.length > 0;
    const popped = hasMaterializedStack
      ? state.withStackPop(this.fromIndex)
      : state.withCell(this.fromIndex, 0);
    return popped.withStackPush(this.toIndex, piece);
  }
  public override actionType(): ActionType {
    return ActionMoveStacking.TYPE;
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
