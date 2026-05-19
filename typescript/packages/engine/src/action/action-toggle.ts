/** Java parity: Core/src/other/action/puzzle/ActionToggle.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionToggle extends BaseAction {
  public static readonly TYPE: ActionType = "Toggle";

  private readonly toIndex: number;
  private readonly whatValue: number;

  public constructor(to: number, what: number) {
    super();
    this.toIndex = to;
    this.whatValue = what;
  }

  public override apply(state: State): State {
    const current = state.cells[this.toIndex] ?? 0;
    const next = current === this.whatValue ? 0 : this.whatValue;
    return state.withCell(this.toIndex, next);
  }

  public override actionType(): ActionType {
    return ActionToggle.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override what(): number {
    return this.whatValue;
  }
}
