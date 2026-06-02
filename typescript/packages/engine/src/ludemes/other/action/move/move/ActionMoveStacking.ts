// @java Core/src/other/action/move/move/ActionMoveStacking.java ActionMoveStacking
/**
 * Moves a full stack from a site to another.
 *
 * Faithful 1:1 transliteration of other.action.move.move.ActionMoveStacking.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, LudiiContext, extractData, UNDEFINED } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";
import { ActionMoveTopPiece } from "./ActionMoveTopPiece.js";

export class ActionMoveStacking extends ActionMoveTopPiece {
  // -------------------------------------------------------------------------
  private levelFromField: number;
  private levelToField: number;
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | null | string,
    from?: number,
    levelFrom?: number,
    typeTo?: SiteType | null,
    to?: number,
    levelTo?: number,
    state?: number,
    rotation?: number,
    value?: number,
  ) {
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      super(typeFromOrDetailed);
      const ds = typeFromOrDetailed;
      const strLevelFrom = extractData(ds, "levelFrom");
      this.levelFromField = strLevelFrom === "" ? UNDEFINED : parseInt(strLevelFrom, 10);
      const strLevelTo = extractData(ds, "levelTo");
      this.levelToField = strLevelTo === "" ? UNDEFINED : parseInt(strLevelTo, 10);
    } else {
      super(typeFromOrDetailed as SiteType | null, from, typeTo, to, state, rotation, value);
      this.levelFromField = levelFrom!;
      this.levelToField = levelTo!;
    }
  }

  override apply(context: LudiiContext, _store: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeToField === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      // Snapshot full stacks
      const sizeFrom: number = csFrom.sizeStack(this.fromSite, this.typeFrom);
      const sizeTo: number = csTo.sizeStack(this.toSite, this.typeToField);
      this.previousWhatFrom = new Array(sizeFrom).fill(0);
      this.previousWhoFrom = new Array(sizeFrom).fill(0);
      this.previousStateFrom = new Array(sizeFrom).fill(0);
      this.previousRotationFrom = new Array(sizeFrom).fill(0);
      this.previousValueFrom = new Array(sizeFrom).fill(0);
      for (let lvl = 0; lvl < sizeFrom; lvl++) {
        this.previousWhatFrom[lvl] = csFrom.what(this.fromSite, lvl, this.typeFrom);
        this.previousWhoFrom[lvl] = csFrom.who(this.fromSite, lvl, this.typeFrom);
        this.previousStateFrom[lvl] = csFrom.state(this.fromSite, lvl, this.typeFrom);
        this.previousRotationFrom[lvl] = csFrom.rotation(this.fromSite, lvl, this.typeFrom);
        this.previousValueFrom[lvl] = csFrom.value(this.fromSite, lvl, this.typeFrom);
      }
      this.previousWhatTo = new Array(sizeTo).fill(0);
      this.previousWhoTo = new Array(sizeTo).fill(0);
      this.previousStateTo = new Array(sizeTo).fill(0);
      this.previousRotationTo = new Array(sizeTo).fill(0);
      this.previousValueTo = new Array(sizeTo).fill(0);
      for (let lvl = 0; lvl < sizeTo; lvl++) {
        this.previousWhatTo[lvl] = csTo.what(this.toSite, lvl, this.typeToField);
        this.previousWhoTo[lvl] = csTo.who(this.toSite, lvl, this.typeToField);
        this.previousStateTo[lvl] = csTo.state(this.toSite, lvl, this.typeToField);
        this.previousRotationTo[lvl] = csTo.rotation(this.toSite, lvl, this.typeToField);
        this.previousValueTo[lvl] = csTo.value(this.toSite, lvl, this.typeToField);
      }
      this.alreadyApplied = true;
    }

    // Move entire stack from fromSite to toSite
    const sizeFrom: number = csFrom.sizeStack(this.fromSite, this.typeFrom);
    for (let lvl = 0; lvl < sizeFrom; lvl++) {
      const what: number = csFrom.what(this.fromSite, lvl, this.typeFrom);
      const who: number = csFrom.who(this.fromSite, lvl, this.typeFrom);
      const st: number = csFrom.state(this.fromSite, lvl, this.typeFrom);
      const rot: number = csFrom.rotation(this.fromSite, lvl, this.typeFrom);
      const val: number = csFrom.value(this.fromSite, lvl, this.typeFrom);
      csTo.addItemStackGeneric(context.state(), this.toSite, what, who, st, rot, val, this.typeToField, context.game());
      if (what !== 0) {
        context.state().owned().remove(who, what, this.fromSite, this.typeFrom);
        context.state().owned().add(who, what, this.toSite, this.typeToField);
      }
    }
    csFrom.setSite(context.state(), this.fromSite, 0, 0, 0, -1, -1, -1, this.typeFrom);
    return this;
  }

  override undo(context: LudiiContext, _discard: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeToField === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    csFrom.setSize(context.state(), this.fromSite, this.previousWhatFrom.length, this.typeFrom);
    for (let lvl = 0; lvl < this.previousWhatFrom.length; lvl++) {
      csFrom.setSite(context.state(), this.fromSite,
        this.previousWhoFrom[lvl], this.previousWhatFrom[lvl], 1,
        this.previousStateFrom[lvl], this.previousRotationFrom[lvl], this.previousValueFrom[lvl],
        this.typeFrom);
    }
    csTo.setSize(context.state(), this.toSite, this.previousWhatTo.length, this.typeToField);
    for (let lvl = 0; lvl < this.previousWhatTo.length; lvl++) {
      csTo.setSite(context.state(), this.toSite,
        this.previousWhoTo[lvl], this.previousWhatTo[lvl], 1,
        this.previousStateTo[lvl], this.previousRotationTo[lvl], this.previousValueTo[lvl],
        this.typeToField);
    }
    return this;
  }

  override toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Move:";
    sb += "typeFrom=" + this.typeFrom;
    sb += ",from=" + this.fromSite;
    sb += ",levelFrom=" + this.levelFromField;
    sb += ",typeTo=" + this.typeToField;
    sb += ",to=" + this.toSite;
    sb += ",levelTo=" + this.levelToField;
    if (this.stateField !== UNDEFINED) sb += ",state=" + this.stateField;
    if (this.rotationField !== UNDEFINED) sb += ",rotation=" + this.rotationField;
    if (this.valueField !== UNDEFINED) sb += ",value=" + this.valueField;
    sb += ",stack=true";
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  override levelFrom(): number { return this.levelFromField; }
  override levelTo(): number { return this.levelToField; }
  override setLevelFrom(levelA: number): void { this.levelFromField = levelA; }
  override setLevelTo(levelB: number): void { this.levelToField = levelB; }
  override isStacking(): boolean { return true; }

  override actionType(): ActionType { return "Move"; }
}
