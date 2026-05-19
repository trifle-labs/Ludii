/** Java parity: Core/src/other/action/state/ActionBet.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionBet extends BaseAction {
  public static readonly TYPE: ActionType = "Bet";

  private readonly player: number;
  private readonly amount: number;

  public constructor(player: number, amount: number) {
    super();
    this.player = player;
    this.amount = amount;
  }

  public override apply(state: State): State {
    // Bet moves chips from a player's amount into the pot.
    const prevAmount = state.amount(this.player);
    return state
      .withAmount(this.player, prevAmount - this.amount)
      .withPot(state.pot + this.amount);
  }
  public override actionType(): ActionType {
    return ActionBet.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override value(): number {
    return this.amount;
  }
}
