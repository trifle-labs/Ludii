// @java Core/src/other/action/state/ActionSetValue.java ActionSetValue
/**
 * Sets the piece value of a site.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetValue.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED, GROUND_LEVEL } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetValue extends BaseAction {
  private readonly toSite: number;
  private readonly levelField: number;
  private readonly valueField: number;
  private typeField: SiteType | null;
  private alreadyApplied = false;
  private previousValue = 0;

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    level?: number,
    value?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevel = extractData(ds, "level");
      this.levelField = strLevel === "" ? UNDEFINED : parseInt(strLevel, 10);
      const strValue = extractData(ds, "value");
      this.valueField = parseInt(strValue, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.levelField = level ?? UNDEFINED;
      this.valueField = value!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    const level = this.levelField === UNDEFINED ? 0 : this.levelField;

    if (!this.alreadyApplied) {
      this.previousValue = cs.value(this.toSite, level, this.typeField);
      this.alreadyApplied = true;
    }

    cs.setSite(context.state(), this.toSite, -1, -1, -1, -1, -1, this.valueField, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    cs.setSite(context.state(), this.toSite, -1, -1, -1, -1, -1, this.previousValue, this.typeField);
    return this;
  }

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetValue:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetValue"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "(value=" + this.valueField + ")";
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SetValue at " + this.toSite + " = " + this.valueField + ")";
  }

  override to(): number { return this.toSite; }
  override levelTo(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override value(): number { return this.valueField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetValue"; }
}
