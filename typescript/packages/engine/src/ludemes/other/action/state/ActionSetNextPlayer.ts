// @java Core/src/other/action/state/ActionSetNextPlayer.java ActionSetNextPlayer
/**
 * Sets the next player.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetNextPlayer.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetNextPlayer extends BaseAction {
  private readonly playerIndex: number;
  private alreadyApplied = false;
  private previousNextPlayer = 0;

  constructor(playerOrDetailed: number | string) {
    super();
    if (typeof playerOrDetailed === "string") {
      const ds = playerOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.playerIndex = playerOrDetailed;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousNextPlayer = context.state().next();
      this.alreadyApplied = true;
    }
    context.state().setNext(this.playerIndex);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setNext(this.previousNextPlayer);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetNextPlayer:";
    sb += "player=" + this.playerIndex;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetNextPlayer"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Next=P" + this.playerIndex;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Next Player = P" + this.playerIndex + ")";
  }

  override who(): number { return this.playerIndex; }
  override playerSelected(): number { return this.playerIndex; }

  override actionType(): ActionType { return "SetNextPlayer"; }
}
