// @java Core/src/other/action/others/ActionNote.java ActionNote
/**
 * Sends a message to a player.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionNote.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionNote extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly messageText: string;
  private readonly player: number;
  // -------------------------------------------------------------------------

  constructor(messageOrDetailed: string, playerArg?: number) {
    super();
    if (playerArg === undefined) {
      const ds = messageOrDetailed;
      this.messageText = extractData(ds, "message");
      this.player = parseInt(extractData(ds, "to"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.messageText = messageOrDetailed;
      this.player = playerArg;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().addNote(context.trial().moveNumber(), this.player, this.messageText);
    return this;
  }

  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Note:";
    sb += "message=" + this.messageText;
    sb += ",to=" + this.player;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Note"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Note P" + this.player + ": " + this.messageText;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Note " + this.messageText + " to P" + this.player + ")";
  }

  override message(): string { return this.messageText; }
  override who(): number { return this.player; }

  override actionType(): ActionType { return "Note"; }
}
