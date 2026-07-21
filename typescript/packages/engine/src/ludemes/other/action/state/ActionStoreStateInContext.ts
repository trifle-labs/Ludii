// @java Core/src/other/action/state/ActionStoreStateInContext.java ActionStoreStateInContext
/**
 * Stores the current state in the context (for later comparison/undo support).
 *
 * Faithful 1:1 transliteration of other.action.state.ActionStoreStateInContext.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionStoreStateInContext extends BaseAction {
  constructor(detailedString?: string) {
    super();
    if (detailedString !== undefined) {
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.storeCurrentState();
    return this;
  }

  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[StoreState:";
    if (this.decision) sb += "decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "StoreState"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "StoreState"; }
  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "(StoreState)"; }

  override actionType(): ActionType { return "StoreState"; }
}
