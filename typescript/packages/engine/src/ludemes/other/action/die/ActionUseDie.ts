// @java Core/src/other/action/die/ActionUseDie.java ActionUseDie
/**
 * Uses a die and removes it from the current dice of the context.
 *
 * Faithful 1:1 transliteration of other.action.die.ActionUseDie.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionUseDie extends BaseAction {
  // -------------------------------------------------------------------------
  /** Hand Dice index. */
  private readonly indexHandDice: number;
  /** Index Die. */
  private readonly indexDie: number;
  /** Index of the site. */
  private readonly site: number;

  /** Guard: already applied. */
  private alreadyApplied = false;
  /** The previous dice value. */
  private previousCurrentDieValue = 0;
  // -------------------------------------------------------------------------

  constructor(
    indexHandDiceOrDetailed: number | string,
    indexDie?: number,
    toIndex?: number,
  ) {
    super();
    if (typeof indexHandDiceOrDetailed === "string") {
      const detailedString = indexHandDiceOrDetailed;
      const strIndexDie = extractData(detailedString, "indexDie");
      this.indexDie = parseInt(strIndexDie, 10);
      const strIndexHandDice = extractData(detailedString, "indexHandDice");
      this.indexHandDice = parseInt(strIndexHandDice, 10);
      const strSite = extractData(detailedString, "site");
      this.site = parseInt(strSite, 10);
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.indexHandDice = indexHandDiceOrDetailed;
      this.indexDie = indexDie!;
      this.site = toIndex!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousCurrentDieValue =
        context.state().currentDice()[this.indexHandDice][this.indexDie];
      this.alreadyApplied = true;
    }
    context.state().updateCurrentDice(0, this.indexDie, this.indexHandDice);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().updateCurrentDice(
      this.previousCurrentDieValue,
      this.indexDie,
      this.indexHandDice,
    );
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[UseDie:";
    sb += "indexHandDice=" + this.indexHandDice;
    sb += ",indexDie=" + this.indexDie;
    sb += ",site=" + this.site;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "UseDie"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "Die " + this.site;
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "(Die at " + this.site + " is used)";
  }

  override from(): number { return this.site; }
  override to(): number { return this.site; }

  /** @return The index of the hand of dice. */
  getIndexHandDice(): number { return this.indexHandDice; }
  /** @return The index of the die. */
  getIndexDie(): number { return this.indexDie; }

  override actionType(): ActionType { return "UseDie"; }
}
