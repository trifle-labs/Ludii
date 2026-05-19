/**
 * Java parity: Core/src/other/action/die/ActionUpdateDice.java —
 * yields `ActionType.SetStateAndUpdateDice`.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionUpdateDice extends BaseAction {
  public static readonly TYPE: ActionType = "SetStateAndUpdateDice";

  private readonly siteIndex: number;
  private readonly stateValue: number;

  public constructor(siteIndex: number, stateValue: number) {
    super();
    this.siteIndex = siteIndex;
    this.stateValue = stateValue;
  }

  public override apply(state: State): State {
    // Two effects in Java: update the site's state AND roll the dice
    // container. The MVE folds it onto the `stateAt` channel; the
    // dice-roll side-effect is left to a future container model.
    return state.withStateAt(this.siteIndex, this.stateValue);
  }
  public override actionType(): ActionType {
    return ActionUpdateDice.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override state(): number {
    return this.stateValue;
  }
}
