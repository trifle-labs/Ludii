/**
 * Java parity: Core/src/other/action/puzzle/ActionSet.java —
 * sets one of the puzzle's allowable values at a site; yields
 * `ActionType.SetValuePuzzle`.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetValuePuzzle extends BaseAction {
  public static readonly TYPE: ActionType = "SetValuePuzzle";

  private readonly siteIndex: number;
  private readonly valueIndex: number;

  public constructor(siteIndex: number, valueIndex: number) {
    super();
    this.siteIndex = siteIndex;
    this.valueIndex = valueIndex;
  }

  public override apply(state: State): State {
    return state.withCell(this.siteIndex, this.valueIndex);
  }
  public override actionType(): ActionType {
    return ActionSetValuePuzzle.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override value(): number {
    return this.valueIndex;
  }
}
