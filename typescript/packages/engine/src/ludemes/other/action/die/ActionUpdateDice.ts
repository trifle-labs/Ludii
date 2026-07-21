// @java Core/src/other/action/die/ActionUpdateDice.java ActionUpdateDice
/**
 * Sets the state of the site where is the die and update the value of the die.
 *
 * Faithful 1:1 transliteration of other.action.die.ActionUpdateDice.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionUpdateDice extends BaseAction {
  // -------------------------------------------------------------------------
  /** Site index. */
  private readonly site: number;
  /** The new state value. */
  private readonly newState: number;

  /** Guard: already applied. */
  private alreadyAppliedState = false;
  private alreadyAppliedValue = false;
  /** The previous state of the die. */
  private previousState = 0;
  /** The previous value of the die. */
  private previousDieValue = 0;
  // -------------------------------------------------------------------------

  constructor(siteOrDetailed: number | string, newState?: number) {
    super();
    if (typeof siteOrDetailed === "string") {
      const detailedString = siteOrDetailed;
      const strSite = extractData(detailedString, "site");
      this.site = parseInt(strSite, 10);
      const strState = extractData(detailedString, "state");
      this.newState = parseInt(strState, 10);
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.site = siteOrDetailed;
      this.newState = newState!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.newState < 0) return this;

    const cid: number = context.containerId()[this.site];
    const cs: LudiiContext = context.state().containerStates()[cid];

    if (!this.alreadyAppliedState) {
      this.previousState = cs.state(this.site, "Cell");
      this.alreadyAppliedState = true;
    }

    cs.setSite(
      context.state(),
      this.site,
      UNDEFINED, UNDEFINED, UNDEFINED,
      this.newState,
      UNDEFINED, UNDEFINED,
      "Cell",
    );

    if (context.containers()[cid].isDice()) {
      const dice: LudiiContext = context.containers()[cid];
      let indexDice = 0;
      const handDice: unknown[] = context.handDice();
      for (let i = 0; i < handDice.length; i++) {
        const d: LudiiContext = handDice[i] as LudiiContext;
        if (d.index() === dice.index()) { indexDice = i; break; }
      }
      const from: number = context.sitesFrom()[cid];
      const what: number = cs.whatCell(this.site);
      const dieIndex: number = this.site - from;

      if (!this.alreadyAppliedValue) {
        this.previousDieValue = context.state().currentDice()[indexDice][dieIndex];
        this.alreadyAppliedValue = true;
      }

      context.state().currentDice()[indexDice][dieIndex] =
        context.components()[what].getFaces()[this.newState];
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.newState < 0) return this;

    const cid: number = context.containerId()[this.site];
    const cs: LudiiContext = context.state().containerStates()[cid];

    cs.setSite(
      context.state(),
      this.site,
      UNDEFINED, UNDEFINED, UNDEFINED,
      this.previousState,
      UNDEFINED, UNDEFINED,
      "Cell",
    );

    if (context.containers()[cid].isDice()) {
      const dice: LudiiContext = context.containers()[cid];
      let indexDice = 0;
      const handDice: unknown[] = context.handDice();
      for (let i = 0; i < handDice.length; i++) {
        const d: LudiiContext = handDice[i] as LudiiContext;
        if (d.index() === dice.index()) { indexDice = i; break; }
      }
      const from: number = context.sitesFrom()[cid];
      const dieIndex: number = this.site - from;
      context.state().currentDice()[indexDice][dieIndex] = this.previousDieValue;
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SetStateAndUpdateDice:";
    sb += "site=" + this.site;
    sb += ",state=" + this.newState;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetStateAndUpdateDice"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "Die " + this.site + "=" + this.newState;
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "(Die at " + this.site + " state=" + this.newState + ")";
  }

  override from(): number { return this.site; }
  override to(): number { return this.site; }
  override state(): number { return this.newState; }
  override who(): number { return this.newState; }

  override actionType(): ActionType { return "SetStateAndUpdateDice"; }
}
