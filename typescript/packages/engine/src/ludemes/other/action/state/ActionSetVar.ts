// @java Core/src/other/action/state/ActionSetVar.java ActionSetVar
/**
 * Sets a variable in the state.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetVar.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetVar extends BaseAction {
  private readonly name: string;
  private readonly valueField: number;
  private alreadyApplied = false;
  private previousValue = 0;

  constructor(nameOrDetailed: string, value?: number) {
    super();
    if (value === undefined) {
      const ds = nameOrDetailed;
      this.name = extractData(ds, "name");
      this.valueField = parseInt(extractData(ds, "value"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.name = nameOrDetailed;
      this.valueField = value;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousValue = context.state().getValueVar(this.name) ?? 0;
      this.alreadyApplied = true;
    }
    context.state().setValueVar(this.name, this.valueField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setValueVar(this.name, this.previousValue);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetVar:";
    sb += "name=" + this.name;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetVar"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.name + "=" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Var '" + this.name + "' = " + this.valueField + ")";
  }

  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "SetVar"; }
}
