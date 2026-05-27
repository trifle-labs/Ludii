// @java Core/src/other/action/die/ActionUseDie.java ActionUseDie
/** Java parity: Core/src/other/action/die/ActionUseDie.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionUseDie extends BaseAction {
  public static readonly TYPE: ActionType = "UseDie";

  private readonly dieIndex: number;
  private readonly siteIndex: number;

  public constructor(dieIndex: number, siteIndex: number) {
    super();
    this.dieIndex = dieIndex;
    this.siteIndex = siteIndex;
  }

  public override apply(state: State): State {
    // Mark the die used by zeroing its face value, so a later `(forEach Die)`
    // in the same turn skips it (Java sets the die's current value to 0).
    if (this.dieIndex < 0 || this.dieIndex >= state.diceValues.length) {
      return state;
    }
    const next = [...state.diceValues];
    next[this.dieIndex] = 0;
    return state.withDiceValues(next);
  }
  public override actionType(): ActionType {
    return ActionUseDie.TYPE;
  }
  public override from(): number {
    return this.dieIndex;
  }
  public override to(): number {
    return this.siteIndex;
  }
}
