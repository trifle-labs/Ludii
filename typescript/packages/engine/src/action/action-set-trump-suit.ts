/** Java parity: Core/src/other/action/state/ActionSetTrumpSuit.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetTrumpSuit extends BaseAction {
  public static readonly TYPE: ActionType = "SetTrumpSuit";

  private readonly suit: number;

  public constructor(suit: number) {
    super();
    this.suit = suit;
  }

  public override apply(state: State): State {
    return state.withTrumpSuit(this.suit);
  }
  public override actionType(): ActionType {
    return ActionSetTrumpSuit.TYPE;
  }
  public override value(): number {
    return this.suit;
  }
}
