// @java Core/src/other/action/state/ActionAddPlayerToTeam.java ActionAddPlayerToTeam
/**
 * Adds a player to a team.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionAddPlayerToTeam.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionAddPlayerToTeam extends BaseAction {
  private readonly team: number;
  private readonly playerIndex: number;
  private alreadyApplied = false;
  private previousTeam = 0;

  constructor(teamOrDetailed: number | string, player?: number) {
    super();
    if (typeof teamOrDetailed === "string") {
      const ds = teamOrDetailed;
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      this.team = parseInt(extractData(ds, "team"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.team = teamOrDetailed;
      this.playerIndex = player!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousTeam = context.state().getTeam(this.playerIndex);
      this.alreadyApplied = true;
    }
    context.state().setPlayerToTeam(this.playerIndex, this.team);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setPlayerToTeam(this.playerIndex, this.previousTeam);
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[AddPlayerToTeam:";
    sb += "team=" + this.team;
    sb += ",player=" + this.playerIndex;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "AddPlayerToTeam"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Team" + this.team + " + P" + this.playerIndex;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Add P" + this.playerIndex + " to Team" + this.team + ")";
  }

  override actionType(): ActionType { return "AddPlayerToTeam"; }
}
