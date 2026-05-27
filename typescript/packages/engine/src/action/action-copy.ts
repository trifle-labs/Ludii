// @java Core/src/other/action/move/ActionCopy.java ActionCopy
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
    // Java parity: ActionCopy moves the source piece to `to` then restores the
    // source to its original who/what/count — net effect is that `to` carries a
    // copy of the source's owner *and* component, while the source is unchanged.
    const owner = state.cells[this.fromIndex] ?? 0;
    if (owner === 0) return state;
    const what = state.whatAtSite(this.fromIndex);
    const count = state.countAtSite(this.fromIndex) || 1;
    let next = state.withCell(this.toIndex, owner);
    if (what !== 0) next = next.withWhatAt(this.toIndex, what);
    next = next.withCountAt(this.toIndex, count);
    return next;
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
