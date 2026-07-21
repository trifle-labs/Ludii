// @java Core/src/other/action/others/ActionSwap.java ActionSwap
/**
 * Swap two players.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionSwap.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSwap extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly player1: number;
  private readonly player2: number;
  // -------------------------------------------------------------------------

  constructor(player1OrDetailed: number | string, player2?: number) {
    super();
    if (typeof player1OrDetailed === "string") {
      const ds = player1OrDetailed;
      this.player1 = parseInt(extractData(ds, "player1"), 10);
      this.player2 = parseInt(extractData(ds, "player2"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.player1 = player1OrDetailed;
      this.player2 = player2!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().swapPlayerOrder(this.player1, this.player2);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().swapPlayerOrder(this.player2, this.player1);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Swap:";
    sb += "player1=" + this.player1;
    sb += ",player2=" + this.player2;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Swap"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Swap P" + this.player1 + " P" + this.player2;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Swap P" + this.player1 + " P" + this.player2 + ")";
  }

  override isSwap(): boolean { return true; }
  override isAlwaysGUILegal(): boolean { return true; }

  override actionType(): ActionType { return "Swap"; }
}
