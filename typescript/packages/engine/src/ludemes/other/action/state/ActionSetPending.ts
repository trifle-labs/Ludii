// @java Core/src/other/action/state/ActionSetPending.java ActionSetPending
/**
 * Sets the pending value in the state.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetPending.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetPending extends BaseAction {
  private readonly valueField: number;
  private alreadyApplied = false;
  private previousPending = 0;

  constructor(valueOrDetailed: number | string) {
    super();
    if (typeof valueOrDetailed === "string") {
      const ds = valueOrDetailed;
      this.valueField = parseInt(extractData(ds, "pending"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.valueField = valueOrDetailed;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousPending = context.state().pendingValue();
      this.alreadyApplied = true;
    }
    context.state().setPendingValue(this.valueField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setPendingValue(this.previousPending);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetPending:";
    sb += "pending=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetPending"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Pending=" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Pending = " + this.valueField + ")";
  }

  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "SetPending"; }
}
