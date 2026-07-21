// @java Core/src/other/action/others/ActionNextInstance.java ActionNextInstance
/**
 * Moves the state on to the next instance in a Match.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionNextInstance.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionNextInstance extends BaseAction {
  constructor(detailedString?: string) {
    super();
    if (detailedString !== undefined) {
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    }
  }

  apply(_context: LudiiContext, _store: boolean): Action { return this; }
  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[NextInstance:";
    if (this.decision) sb += "decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "NextInstance"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "Next Game"; }
  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "(Next Game)"; }

  override containsNextInstance(): boolean { return true; }

  override actionType(): ActionType { return "NextInstance"; }
}
