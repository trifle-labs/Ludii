// @java Core/src/other/action/state/ActionSetScore.java ActionSetScore
/**
 * Sets the score of a player.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetScore.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetScore extends BaseAction {
  private readonly playerIndex: number;
  private readonly score: number;
  private alreadyApplied = false;
  private previousScore = 0;

  constructor(playerOrDetailed: number | string, score?: number) {
    super();
    if (typeof playerOrDetailed === "string") {
      const ds = playerOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      this.score = parseInt(extractData(ds, "score"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.playerIndex = playerOrDetailed;
      this.score = score!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousScore = context.score(this.playerIndex);
      this.alreadyApplied = true;
    }
    context.setScore(this.playerIndex, this.score);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.setScore(this.playerIndex, this.previousScore);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetScore:";
    sb += "player=" + this.playerIndex;
    sb += ",score=" + this.score;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetScore"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "P" + this.playerIndex + " score=" + this.score;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Score P" + this.playerIndex + " = " + this.score + ")";
  }

  override who(): number { return this.playerIndex; }

  override actionType(): ActionType { return "SetScore"; }
}
