// @java Core/src/other/action/others/ActionSetValueOfPlayer.java ActionSetValueOfPlayer
/**
 * Sets the value of a player in the state.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionSetValueOfPlayer.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetValueOfPlayer extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly playerIndex: number;
  private readonly valueField: number;
  private alreadyApplied = false;
  private previousValue = 0;
  // -------------------------------------------------------------------------

  constructor(playerOrDetailed: number | string, value?: number) {
    super();
    if (typeof playerOrDetailed === "string") {
      const ds = playerOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      this.valueField = parseInt(extractData(ds, "value"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.playerIndex = playerOrDetailed;
      this.valueField = value!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousValue = context.state().getValue(this.playerIndex);
      this.alreadyApplied = true;
    }
    context.state().setValueForPlayer(this.playerIndex, this.valueField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setValueForPlayer(this.playerIndex, this.previousValue);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetValueOfPlayer:";
    sb += "player=" + this.playerIndex;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetValueOfPlayer"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "P" + this.playerIndex + "=" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SetValue P" + this.playerIndex + "=" + this.valueField + ")";
  }

  override who(): number { return this.playerIndex; }
  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "SetValueOfPlayer"; }
}
