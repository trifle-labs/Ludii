// @java Core/src/other/action/others/ActionSwap.java ActionSwap
/** Java parity: Core/src/other/action/move/ActionSwap.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSwap extends BaseAction {
  public static readonly TYPE: ActionType = "Swap";

  private readonly fromIndex: number;
  private readonly toIndex: number;

  public constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    const a = state.cells[this.fromIndex] ?? 0;
    const b = state.cells[this.toIndex] ?? 0;
    return state.withCell(this.fromIndex, b).withCell(this.toIndex, a);
  }
  public override actionType(): ActionType {
    return ActionSwap.TYPE;
  }
  public override isSwap(): boolean {
    return true;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
}
