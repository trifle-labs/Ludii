// @java Core/src/other/action/move/ActionMoveN.java ActionMoveN
/**
 * Moves many pieces from a site to another (but not in a stack).
 *
 * Faithful 1:1 transliteration of other.action.move.ActionMoveN.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionMoveN extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly typeFrom: SiteType;
  private readonly fromSite: number;
  private readonly typeTo: SiteType;
  private readonly toSite: number;
  private readonly countField: number;

  // Undo data
  private alreadyApplied = false;
  private previousWhatFrom: number[] = [];
  private previousWhoFrom: number[] = [];
  private previousStateFrom: number[] = [];
  private previousRotationFrom: number[] = [];
  private previousValueFrom: number[] = [];
  private previousCountFrom = 0;
  private previousWhatTo: number[] = [];
  private previousWhoTo: number[] = [];
  private previousStateTo: number[] = [];
  private previousRotationTo: number[] = [];
  private previousValueTo: number[] = [];
  private previousCountTo = 0;
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | string,
    from?: number,
    typeTo?: SiteType,
    to?: number,
    count?: number,
  ) {
    super();
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      const ds = typeFromOrDetailed;
      const strTypeFrom = extractData(ds, "typeFrom");
      this.typeFrom = strTypeFrom === "" ? "Cell" : (strTypeFrom as SiteType);
      const strFrom = extractData(ds, "from");
      this.fromSite = parseInt(strFrom, 10);
      const strTypeTo = extractData(ds, "typeTo");
      this.typeTo = strTypeTo === "" ? "Cell" : (strTypeTo as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strCount = extractData(ds, "count");
      this.countField = parseInt(strCount, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeFrom = typeFromOrDetailed as SiteType;
      this.fromSite = from!;
      this.typeTo = typeTo!;
      this.toSite = to!;
      this.countField = count!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      this.previousCountFrom = csFrom.count(this.fromSite, this.typeFrom);
      this.previousWhatFrom = [csFrom.what(this.fromSite, 0, this.typeFrom)];
      this.previousWhoFrom = [csFrom.who(this.fromSite, 0, this.typeFrom)];
      this.previousStateFrom = [csFrom.state(this.fromSite, 0, this.typeFrom)];
      this.previousRotationFrom = [csFrom.rotation(this.fromSite, 0, this.typeFrom)];
      this.previousValueFrom = [csFrom.value(this.fromSite, 0, this.typeFrom)];
      this.previousCountTo = csTo.count(this.toSite, this.typeTo);
      this.previousWhatTo = [csTo.what(this.toSite, 0, this.typeTo)];
      this.previousWhoTo = [csTo.who(this.toSite, 0, this.typeTo)];
      this.previousStateTo = [csTo.state(this.toSite, 0, this.typeTo)];
      this.previousRotationTo = [csTo.rotation(this.toSite, 0, this.typeTo)];
      this.previousValueTo = [csTo.value(this.toSite, 0, this.typeTo)];
      this.alreadyApplied = true;
    }

    const what: number = csFrom.what(this.fromSite, this.typeFrom);
    const who: number = csFrom.who(this.fromSite, this.typeFrom);
    const stateFrom: number = csFrom.state(this.fromSite, this.typeFrom);
    const rotationFrom: number = csFrom.rotation(this.fromSite, this.typeFrom);
    const valueFrom: number = csFrom.value(this.fromSite, this.typeFrom);

    const newFromCount: number = csFrom.count(this.fromSite, this.typeFrom) - this.countField;
    if (newFromCount <= 0) {
      csFrom.setSite(context.state(), this.fromSite, 0, 0, 0, -1, -1, -1, this.typeFrom);
    } else {
      csFrom.setSite(context.state(), this.fromSite, who, what, newFromCount, stateFrom, rotationFrom, valueFrom, this.typeFrom);
    }

    const newToCount: number = csTo.count(this.toSite, this.typeTo) + this.countField;
    csTo.setSite(context.state(), this.toSite, who, what, newToCount, stateFrom, rotationFrom, valueFrom, this.typeTo);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    csFrom.setSite(context.state(), this.fromSite,
      this.previousWhoFrom[0], this.previousWhatFrom[0], this.previousCountFrom,
      this.previousStateFrom[0], this.previousRotationFrom[0], this.previousValueFrom[0],
      this.typeFrom);
    csTo.setSite(context.state(), this.toSite,
      this.previousWhoTo[0], this.previousWhatTo[0], this.previousCountTo,
      this.previousStateTo[0], this.previousRotationTo[0], this.previousValueTo[0],
      this.typeTo);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[MoveN:";
    sb += "typeFrom=" + this.typeFrom;
    sb += ",from=" + this.fromSite;
    sb += ",typeTo=" + this.typeTo;
    sb += ",to=" + this.toSite;
    sb += ",count=" + this.countField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "MoveN"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.fromSite + "->" + this.toSite + "x" + this.countField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(MoveN " + this.countField + " from " + this.fromSite + " to " + this.toSite + ")";
  }

  override from(): number { return this.fromSite; }
  override to(): number { return this.toSite; }
  override count(): number { return this.countField; }
  override fromType(): SiteType { return this.typeFrom; }
  override toType(): SiteType { return this.typeTo; }

  override actionType(): ActionType { return "MoveN"; }
}
