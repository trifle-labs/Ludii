// @java Core/src/other/action/cards/ActionSetTrumpSuit.java ActionSetTrumpSuit
/**
 * Sets the trump suit for card games.
 *
 * Faithful 1:1 transliteration of other.action.cards.ActionSetTrumpSuit.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetTrumpSuit extends BaseAction {
  // -------------------------------------------------------------------------
  /** The new trump suit. */
  private readonly trumpSuit: number;

  /** A variable to know that we already applied this action. */
  private alreadyApplied = false;
  /** The previous trump suit. */
  private previousTrumpSuit = 0;
  // -------------------------------------------------------------------------

  constructor(trumpSuitOrDetailed: number | string) {
    super();
    if (typeof trumpSuitOrDetailed === "string") {
      const detailedString = trumpSuitOrDetailed;
      // assert detailedString.startsWith("[SetTrumpSuit:")
      const strTrumpSuit = extractData(detailedString, "trumpSuit");
      this.trumpSuit = parseInt(strTrumpSuit, 10);
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.trumpSuit = trumpSuitOrDetailed;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousTrumpSuit = context.state().trumpSuit();
      this.alreadyApplied = true;
    }
    context.state().setTrumpSuit(this.trumpSuit);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setTrumpSuit(this.previousTrumpSuit);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetTrumpSuit:";
    sb += "trumpSuit=" + this.trumpSuit;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetTrumpSuit"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "TrumpSuit = " + this.trumpSuit;
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "(TrumpSuit = " + this.trumpSuit + ")";
  }

  override isOtherMove(): boolean { return true; }

  override actionType(): ActionType { return "SetTrumpSuit"; }

  override what(): number { return this.trumpSuit; }
}
