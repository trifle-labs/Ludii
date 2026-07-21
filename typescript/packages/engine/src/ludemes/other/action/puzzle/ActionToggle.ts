// @java Core/src/other/action/puzzle/ActionToggle.java ActionToggle
/**
 * Excludes a value from the possible values of a variable in a deduction puzzle.
 *
 * Faithful 1:1 transliteration of other.action.puzzle.ActionToggle.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionToggle extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly varIndex: number;
  private readonly valueField: number;
  private typeField: SiteType | null;

  private alreadyApplied = false;
  private previousPossible = false;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    value?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strVar = extractData(ds, "var");
      this.varIndex = parseInt(strVar, 10);
      const strValue = extractData(ds, "value");
      this.valueField = parseInt(strValue, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.varIndex = to!;
      this.valueField = value!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.varIndex] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];

    if (!this.alreadyApplied) {
      this.previousPossible = cs.isPossible(this.varIndex, this.valueField, this.typeField);
      this.alreadyApplied = true;
    }

    const current: boolean = cs.isPossible(this.varIndex, this.valueField, this.typeField);
    cs.setPossible(context.state(), this.varIndex, this.valueField, !current, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.varIndex] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    cs.setPossible(context.state(), this.varIndex, this.valueField, this.previousPossible, this.typeField);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Toggle:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "var=" + this.varIndex;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Toggle"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.varIndex + "~" + this.valueField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Toggle var=" + this.varIndex + " value=" + this.valueField + ")";
  }

  override to(): number { return this.varIndex; }
  override value(): number { return this.valueField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Toggle"; }
}
