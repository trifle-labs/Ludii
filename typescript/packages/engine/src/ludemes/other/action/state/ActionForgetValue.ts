// @java Core/src/other/action/state/ActionForgetValue.java ActionForgetValue
/**
 * Forgets a value remembered before.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionForgetValue.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionForgetValue extends BaseAction {
  private readonly valueField: number;
  private readonly name: string | null;

  constructor(nameOrDetailed: string, value?: number) {
    super();
    if (value === undefined) {
      const ds = nameOrDetailed;
      const strName = extractData(ds, "name");
      this.name = strName === "" ? null : strName;
      this.valueField = parseInt(extractData(ds, "value"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.name = nameOrDetailed === "" ? null : nameOrDetailed;
      this.valueField = value;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.name === null) {
      context.state().rememberingValues().remove(this.valueField);
    } else {
      const rv: number[] | undefined = context.state().mapRememberingValues().get(this.name);
      if (rv !== undefined) {
        const idx = rv.indexOf(this.valueField);
        if (idx >= 0) rv.splice(idx, 1);
        if (rv.length === 0) context.state().mapRememberingValues().delete(this.name);
      }
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.name === null) {
      context.state().rememberingValues().unshift(this.valueField);
    } else {
      let rv: number[] | undefined = context.state().mapRememberingValues().get(this.name);
      if (rv === undefined) {
        rv = [];
        context.state().mapRememberingValues().set(this.name, rv);
      }
      rv.unshift(this.valueField);
    }
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[ForgetValue:";
    sb += "name=" + this.name;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "ForgetValue"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "RememberedValues-=" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Forget Value " + (this.name !== null ? "'" + this.name + "' " : "") + this.valueField + ")";
  }

  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "Forget"; }
}
