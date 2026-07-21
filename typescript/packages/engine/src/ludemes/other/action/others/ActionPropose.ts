// @java Core/src/other/action/others/ActionPropose.java ActionPropose
/**
 * Proposes a subject to vote.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionPropose.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionPropose extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly propositionText: string;
  private readonly propositionInt: number;
  // -------------------------------------------------------------------------

  constructor(propositionOrDetailed: string, propositionIntArg?: number) {
    super();
    if (propositionIntArg === undefined) {
      const ds = propositionOrDetailed;
      this.propositionText = extractData(ds, "proposition");
      this.propositionInt = parseInt(extractData(ds, "propositionInt"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.propositionText = propositionOrDetailed;
      this.propositionInt = propositionIntArg;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().propositions().add(this.propositionInt);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().propositions().remove(this.propositionInt);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Propose:";
    sb += "proposition=" + this.propositionText;
    sb += ",propositionInt=" + this.propositionInt;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Propose"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Propose " + this.propositionText;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Propose " + this.propositionText + ")";
  }

  override isPropose(): boolean { return true; }
  override proposition(): string { return this.propositionText; }

  override actionType(): ActionType { return "Propose"; }
}
