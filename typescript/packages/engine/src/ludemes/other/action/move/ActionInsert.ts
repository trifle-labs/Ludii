// @java Core/src/other/action/move/ActionInsert.java ActionInsert
/**
 * Inserts a component inside a stack.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionInsert.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionInsert extends BaseAction {
  // -------------------------------------------------------------------------
  private typeField: SiteType | null;
  private readonly toSite: number;
  private readonly levelField: number;
  private readonly whatField: number;
  private readonly stateField: number;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    level?: number,
    what?: number,
    state?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevel = extractData(ds, "level");
      this.levelField = parseInt(strLevel, 10);
      const strWhat = extractData(ds, "what");
      this.whatField = parseInt(strWhat, 10);
      const strState = extractData(ds, "state");
      this.stateField = parseInt(strState, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.levelField = level!;
      this.whatField = what!;
      this.stateField = state!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];
    cs.insert(context.state(), this.toSite, this.levelField, this.whatField, this.stateField, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];
    cs.remove(context.state(), this.toSite, this.levelField, this.typeField);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Insert:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    sb += ",level=" + this.levelField;
    sb += ",what=" + this.whatField;
    sb += ",state=" + this.stateField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Insert"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "/" + this.levelField + "=" + this.whatField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Insert " + this.whatField + " at " + this.toSite + "/" + this.levelField + ")";
  }

  override to(): number { return this.toSite; }
  override levelTo(): number { return this.levelField; }
  override what(): number { return this.whatField; }
  override state(): number { return this.stateField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Insert"; }
}
