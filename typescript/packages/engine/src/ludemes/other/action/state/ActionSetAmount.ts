// @java Core/src/other/action/state/ActionSetAmount.java ActionSetAmount
/**
 * Sets the amount of a player.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetAmount.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetAmount extends BaseAction {
  private readonly playerIndex: number;
  private readonly amount: number;
  private alreadyApplied = false;
  private previousAmount = 0;

  constructor(playerOrDetailed: number | string, amount?: number) {
    super();
    if (typeof playerOrDetailed === "string") {
      const ds = playerOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      this.amount = parseInt(extractData(ds, "amount"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.playerIndex = playerOrDetailed;
      this.amount = amount!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousAmount = context.state().amount(this.playerIndex);
      this.alreadyApplied = true;
    }
    context.state().setAmount(this.playerIndex, this.amount);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setAmount(this.playerIndex, this.previousAmount);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetAmount:";
    sb += "player=" + this.playerIndex;
    sb += ",amount=" + this.amount;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Amount"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "P" + this.playerIndex + "=$" + this.amount;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Amount P" + this.playerIndex + " = " + this.amount + ")";
  }

  override who(): number { return this.playerIndex; }

  override actionType(): ActionType { return "SetAmount"; }
}
