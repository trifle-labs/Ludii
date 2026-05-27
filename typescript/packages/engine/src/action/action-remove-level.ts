// @java Core/src/other/action/move/remove/ActionRemoveLevel.java ActionRemoveLevel
/**
 * Java parity: Core/src/other/action/move/remove/ActionRemoveLevel.java
 * — remove a piece at a specific stack level. The TS stack model is
 * push/pop-only; we approximate by popping from the top regardless of
 * the recorded level (the level is preserved as bookkeeping).
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionRemoveLevel extends BaseAction {
  public static readonly TYPE: ActionType = "Remove";

  private readonly siteIndex: number;
  private readonly levelValue: number;

  public constructor(siteIndex: number, level: number) {
    super();
    this.siteIndex = siteIndex;
    this.levelValue = level;
    this.levelToValue = level;
  }

  public override apply(state: State): State {
    const stackSize = state.stackSize(this.siteIndex);
    if (stackSize > 0) return state.withStackPop(this.siteIndex);
    // What-based occupancy: clear the component so the emptied site does not
    // read as occupied via a stale `what` (Java updates the empty-set here).
    return state.withCell(this.siteIndex, 0).withWhatAt(this.siteIndex, 0);
  }
  public override actionType(): ActionType {
    return ActionRemoveLevel.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override levelTo(): number {
    return this.levelValue;
  }
  public override isStacking(): boolean {
    return true;
  }
}
