// @java Core/src/other/action/state/ActionSetPot.java ActionSetPot
/**
 * Sets the pot of the state.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetPot.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetPot extends BaseAction {
  private readonly pot: number;
  private alreadyApplied = false;
  private previousPot = 0;

  constructor(potOrDetailed: number | string) {
    super();
    if (typeof potOrDetailed === "string") {
      const ds = potOrDetailed;
      this.pot = parseInt(extractData(ds, "pot"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.pot = potOrDetailed;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousPot = context.state().pot();
      this.alreadyApplied = true;
    }
    context.state().setPot(this.pot);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setPot(this.previousPot);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetPot:";
    sb += "pot=" + this.pot;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetPot"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Pot=$" + this.pot;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Pot = " + this.pot + ")";
  }

  override actionType(): ActionType { return "SetPot"; }
}
