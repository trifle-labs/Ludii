// @java Core/src/other/action/state/ActionBet.java ActionBet
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
    // @java ActionBet.java:84 — `context.state().setAmount(player, bet)`:
    // the action SETS the player's amount to the bet and never touches the
    // pot. Pot bookkeeping is the game's own `(then (set Pot (+ (pot)
    // (amount P))))` consequence (Morra.lud). The old subtract-and-add-to-pot
    // made `(amount P1)` post-bet garbage, so Morra's `(= "SumFingers"
    // (amount #1))` score check never fired and the (byScore) end never came.
    return state.withAmount(this.player, this.amount);
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
