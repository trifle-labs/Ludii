// @java Core/src/other/action/state/ActionSetCounter.java ActionSetCounter
/**
 * Sets the counter of the state.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetCounter.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetCounter extends BaseAction {
  private readonly counter: number;
  private alreadyApplied = false;
  private previousCounter = 0;

  constructor(counterOrDetailed: number | string) {
    super();
    if (typeof counterOrDetailed === "string") {
      const ds = counterOrDetailed;
      this.counter = parseInt(extractData(ds, "counter"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.counter = counterOrDetailed;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousCounter = context.state().counter();
      this.alreadyApplied = true;
    }
    context.state().setCounter(this.counter);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setCounter(this.previousCounter);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetCounter:";
    sb += "counter=" + this.counter;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetCounter"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Counter=" + this.counter;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Counter = " + this.counter + ")";
  }

  override actionType(): ActionType { return "SetCounter"; }
}
