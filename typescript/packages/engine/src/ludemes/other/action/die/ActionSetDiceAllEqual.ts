// @java Core/src/other/action/die/ActionSetDiceAllEqual.java ActionSetDiceAllEqual
/**
 * Specifies to the state that all the dice are equals.
 *
 * Faithful 1:1 transliteration of other.action.die.ActionSetDiceAllEqual.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionSetDiceAllEqual extends BaseAction {
  // -------------------------------------------------------------------------
  /** The value to set. */
  private readonly valueField: boolean;

  /** A variable to know that we already applied this action. */
  private alreadyApplied = false;
  /** The previous value of DiceAllEqual. */
  private previousValue = false;
  // -------------------------------------------------------------------------

  constructor(valueOrDetailed: boolean | string) {
    super();
    if (typeof valueOrDetailed === "string") {
      const detailedString = valueOrDetailed;
      const strValue = extractData(detailedString, "value");
      this.valueField = strValue === "true";
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.valueField = valueOrDetailed;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (!this.alreadyApplied) {
      this.previousValue = context.state().isDiceAllEqual();
      this.alreadyApplied = true;
    }
    context.state().setDiceAllEqual(this.valueField);
    // To update the sum of the dice container.
    const handDice: unknown[] = context.handDice();
    for (let i = 0; i < handDice.length; i++) {
      const dice: LudiiContext = handDice[i] as LudiiContext;
      const siteFrom: number = context.sitesFrom()[dice.index()];
      const siteTo: number = context.sitesFrom()[dice.index()] + dice.numSites();
      let sum = 0;
      for (let site = siteFrom; site < siteTo; site++) {
        sum += context.state().currentDice()[i][site - siteFrom];
      }
      context.state().sumDice()[i] = sum;
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().setDiceAllEqual(this.previousValue);
    const handDice: unknown[] = context.handDice();
    for (let i = 0; i < handDice.length; i++) {
      const dice: LudiiContext = handDice[i] as LudiiContext;
      const siteFrom: number = context.sitesFrom()[dice.index()];
      const siteTo: number = context.sitesFrom()[dice.index()] + dice.numSites();
      let sum = 0;
      for (let site = siteFrom; site < siteTo; site++) {
        sum += context.state().currentDice()[i][site - siteFrom];
      }
      context.state().sumDice()[i] = sum;
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetDiceAllEqual:";
    sb += "value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetDiceAllEqual"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return this.valueField ? "Dice Equal" : "Dice Not Equal";
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return this.valueField ? "(Dice Equal)" : "(Dice Not Equal)";
  }

  override actionType(): ActionType { return "SetDiceAllEqual"; }
}
