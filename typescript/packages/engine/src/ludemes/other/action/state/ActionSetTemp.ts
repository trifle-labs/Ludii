// @java Core/src/other/action/state/ActionSetTemp.java ActionSetTemp
/**
 * Sets the temp value in the state.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetTemp.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetTemp extends BaseAction {
  private readonly valueField: number;
  private alreadyApplied = false;
  private previousTemp = 0;

  constructor(valueOrDetailed: number | string) {
    super();
    if (typeof valueOrDetailed === "string") {
      const ds = valueOrDetailed;
      this.valueField = parseInt(extractData(ds, "temp"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.valueField = valueOrDetailed;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousTemp = context.state().temp();
      this.alreadyApplied = true;
    }
    context.state().setTemp(this.valueField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setTemp(this.previousTemp);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetTemp:";
    sb += "temp=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetTemp"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Temp=" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Temp = " + this.valueField + ")";
  }

  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "SetTemp"; }
}
