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
    // Java parity: ActionCopy places a copy of the source piece at `to`
    // while leaving the source completely unchanged.
    // Net effect: `to` carries the same owner and component as `from`; `from` is untouched.
    //
    // Unlike ActionMove, ActionCopy does NOT decrement hand counts.
    // We check `what` (component index) as well as `owner` for Shared pieces
    // which have owner=0 but a valid what.
    const owner = state.who(this.fromIndex);
    const what = state.whatAtSite(this.fromIndex);
    if (owner === 0 && what === 0) return state; // Truly empty source
    let next = state.withCell(this.toIndex, owner);
    if (what !== 0) next = next.withWhatAt(this.toIndex, what);
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
