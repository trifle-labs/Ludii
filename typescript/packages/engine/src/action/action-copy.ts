/** Java parity: Core/src/other/action/move/ActionCopy.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionCopy extends BaseAction {
  public static readonly TYPE: ActionType = "Copy";

  private readonly fromIndex: number;
  private readonly toIndex: number;

  public constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    const owner = state.cells[this.fromIndex] ?? 0;
    if (owner === 0) return state;
    return state.withCell(this.toIndex, owner);
  }
  public override actionType(): ActionType {
    return ActionCopy.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
}
