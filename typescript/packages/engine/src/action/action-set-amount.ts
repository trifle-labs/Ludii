/** Java parity: Core/src/other/action/state/ActionSetAmount.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetAmount extends BaseAction {
  public static readonly TYPE: ActionType = "SetAmount";

  private readonly player: number;
  private readonly amountValue: number;

  public constructor(player: number, amount: number) {
    super();
    this.player = player;
    this.amountValue = amount;
  }

  public override apply(state: State): State {
    return state.withAmount(this.player, this.amountValue);
  }
  public override actionType(): ActionType {
    return ActionSetAmount.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override value(): number {
    return this.amountValue;
  }
}
