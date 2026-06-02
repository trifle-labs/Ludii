// @java Core/src/other/action/state/ActionTrigger.java ActionTrigger
/**
 * Triggers an event.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionTrigger.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionTrigger extends BaseAction {
  private readonly event: string;
  private readonly playerIndex: number;

  constructor(eventOrDetailed: string, player?: number) {
    super();
    if (player === undefined) {
      const ds = eventOrDetailed;
      this.event = extractData(ds, "event");
      this.playerIndex = parseInt(extractData(ds, "player"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.event = eventOrDetailed;
      this.playerIndex = player;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().trigger(this.event, this.playerIndex);
    return this;
  }

  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Trigger:";
    sb += "event=" + this.event;
    sb += ",player=" + this.playerIndex;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Trigger"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Trigger:" + this.event + " P" + this.playerIndex;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Trigger '" + this.event + "' P" + this.playerIndex + ")";
  }

  override who(): number { return this.playerIndex; }

  override actionType(): ActionType { return "Trigger"; }
}
