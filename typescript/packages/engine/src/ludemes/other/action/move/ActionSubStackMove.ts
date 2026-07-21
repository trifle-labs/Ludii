// @java Core/src/other/action/move/ActionSubStackMove.java ActionSubStackMove
/**
 * Moves a part of a stack.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionSubStackMove.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSubStackMove extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly typeFrom: SiteType;
  private readonly fromSite: number;
  private levelFromField = 0;
  private readonly typeTo: SiteType;
  private readonly toSite: number;
  private levelToField = 0;
  private readonly numLevel: number;

  // Undo data
  private alreadyApplied = false;
  private previousWhatFrom: number[] = [];
  private previousWhoFrom: number[] = [];
  private previousStateFrom: number[] = [];
  private previousRotationFrom: number[] = [];
  private previousValueFrom: number[] = [];
  private previousWhatTo: number[] = [];
  private previousWhoTo: number[] = [];
  private previousStateTo: number[] = [];
  private previousRotationTo: number[] = [];
  private previousValueTo: number[] = [];
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | string,
    from?: number,
    levelFrom?: number,
    typeTo?: SiteType,
    to?: number,
    levelTo?: number,
    numLevel?: number,
  ) {
    super();
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      const ds = typeFromOrDetailed;
      const strTypeFrom = extractData(ds, "typeFrom");
      this.typeFrom = strTypeFrom === "" ? "Cell" : (strTypeFrom as SiteType);
      const strFrom = extractData(ds, "from");
      this.fromSite = parseInt(strFrom, 10);
      const strLevelFrom = extractData(ds, "levelFrom");
      this.levelFromField = parseInt(strLevelFrom, 10);
      const strTypeTo = extractData(ds, "typeTo");
      this.typeTo = strTypeTo === "" ? "Cell" : (strTypeTo as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevelTo = extractData(ds, "levelTo");
      this.levelToField = parseInt(strLevelTo, 10);
      const strNumLevel = extractData(ds, "numLevel");
      this.numLevel = parseInt(strNumLevel, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeFrom = typeFromOrDetailed as SiteType;
      this.fromSite = from!;
      this.levelFromField = levelFrom!;
      this.typeTo = typeTo!;
      this.toSite = to!;
      this.levelToField = levelTo!;
      this.numLevel = numLevel!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      const sizeFrom: number = csFrom.sizeStack(this.fromSite, this.typeFrom);
      const sizeTo: number = csTo.sizeStack(this.toSite, this.typeTo);
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
        this.previousWhatTo[lvl] = csTo.what(this.toSite, lvl, this.typeTo);
        this.previousWhoTo[lvl] = csTo.who(this.toSite, lvl, this.typeTo);
        this.previousStateTo[lvl] = csTo.state(this.toSite, lvl, this.typeTo);
        this.previousRotationTo[lvl] = csTo.rotation(this.toSite, lvl, this.typeTo);
        this.previousValueTo[lvl] = csTo.value(this.toSite, lvl, this.typeTo);
      }
      this.alreadyApplied = true;
    }

    // Move numLevel pieces from fromSite starting at levelFromField to toSite
    for (let i = 0; i < this.numLevel; i++) {
      const lvl: number = this.levelFromField + i;
      const what: number = csFrom.what(this.fromSite, lvl, this.typeFrom);
      const who: number = csFrom.who(this.fromSite, lvl, this.typeFrom);
      const st: number = csFrom.state(this.fromSite, lvl, this.typeFrom);
      const rot: number = csFrom.rotation(this.fromSite, lvl, this.typeFrom);
      const val: number = csFrom.value(this.fromSite, lvl, this.typeFrom);
      csTo.addItemStackGeneric(context.state(), this.toSite, what, who, st, rot, val, this.typeTo, context.game());
    }
    csFrom.removeStackLevel(context.state(), this.fromSite, this.levelFromField, this.numLevel, this.typeFrom);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    csFrom.setSize(context.state(), this.fromSite, this.previousWhatFrom.length, this.typeFrom);
    for (let lvl = 0; lvl < this.previousWhatFrom.length; lvl++) {
      csFrom.setSite(context.state(), this.fromSite,
        this.previousWhoFrom[lvl], this.previousWhatFrom[lvl], 1,
        this.previousStateFrom[lvl], this.previousRotationFrom[lvl], this.previousValueFrom[lvl],
        this.typeFrom);
    }
    csTo.setSize(context.state(), this.toSite, this.previousWhatTo.length, this.typeTo);
    for (let lvl = 0; lvl < this.previousWhatTo.length; lvl++) {
      csTo.setSite(context.state(), this.toSite,
        this.previousWhoTo[lvl], this.previousWhatTo[lvl], 1,
        this.previousStateTo[lvl], this.previousRotationTo[lvl], this.previousValueTo[lvl],
        this.typeTo);
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[SubStackMove:";
    sb += "typeFrom=" + this.typeFrom;
    sb += ",from=" + this.fromSite;
    sb += ",levelFrom=" + this.levelFromField;
    sb += ",typeTo=" + this.typeTo;
    sb += ",to=" + this.toSite;
    sb += ",levelTo=" + this.levelToField;
    sb += ",numLevel=" + this.numLevel;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SubStackMove"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.fromSite + "/" + this.levelFromField + "->" + this.toSite + "/" + this.levelToField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SubStackMove from " + this.fromSite + "/" + this.levelFromField +
      " to " + this.toSite + "/" + this.levelToField + " x" + this.numLevel + ")";
  }

  override from(): number { return this.fromSite; }
  override to(): number { return this.toSite; }
  override levelFrom(): number { return this.levelFromField; }
  override levelTo(): number { return this.levelToField; }
  override fromType(): SiteType { return this.typeFrom; }
  override toType(): SiteType { return this.typeTo; }

  override actionType(): ActionType { return "StackMove"; }
}
