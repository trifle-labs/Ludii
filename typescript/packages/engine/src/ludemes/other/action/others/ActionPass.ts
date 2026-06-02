// @java Core/src/other/action/others/ActionPass.java ActionPass
/**
 * Pass the turn.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionPass.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionPass extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly forced: boolean;
  // -------------------------------------------------------------------------

  constructor(forcedOrDetailed: boolean | string) {
    super();
    if (typeof forcedOrDetailed === "string") {
      const ds = forcedOrDetailed;
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
      const strForced = extractData(ds, "forced");
      this.forced = strForced === "" ? false : strForced === "true";
    } else {
      this.forced = forcedOrDetailed;
    }
  }

  apply(_context: LudiiContext, _store: boolean): Action { return this; }
  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Pass:";
    if (this.decision) sb += "decision=" + this.decision;
    if (this.forced) sb += (this.decision ? "," : "") + "forced=" + this.forced;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Pass"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "Pass"; }
  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string { return "(Pass)"; }

  override isPass(): boolean { return true; }
  override isForced(): boolean { return this.forced; }

  override actionType(): ActionType { return "Pass"; }
}
