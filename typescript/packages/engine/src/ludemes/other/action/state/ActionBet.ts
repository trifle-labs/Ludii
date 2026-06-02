// @java Core/src/other/action/state/ActionBet.java ActionBet
/**
 * Makes a bet for a player.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionBet.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionBet extends BaseAction {
  private readonly playerIndex: number;
  private readonly bet: number;
  private alreadyApplied = false;
  private previousBet = 0;

  constructor(playerOrDetailed: number | string, bet?: number) {
    super();
    if (typeof playerOrDetailed === "string") {
      const ds = playerOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      this.bet = parseInt(extractData(ds, "bet"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.playerIndex = playerOrDetailed;
      this.bet = bet!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousBet = context.state().amount(this.playerIndex);
      this.alreadyApplied = true;
    }
    context.state().setAmount(this.playerIndex, this.bet);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setAmount(this.playerIndex, this.previousBet);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Bet:";
    sb += "player=" + this.playerIndex;
    sb += ",bet=" + this.bet;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Bet"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Bet P" + this.playerIndex + " $" + this.bet;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(P" + this.playerIndex + " Bet = " + this.bet + ")";
  }

  override isOtherMove(): boolean { return true; }
  override who(): number { return this.playerIndex; }
  override count(): number { return this.bet; }

  override actionType(): ActionType { return "Bet"; }
}
