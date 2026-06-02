// @java Core/src/other/action/state/ActionSetCount.java ActionSetCount
/**
 * Sets the count of a site.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetCount.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetCount extends BaseAction {
  private readonly whatField: number;
  private readonly toSite: number;
  private readonly countField: number;
  private typeField: SiteType | null;
  private alreadyApplied = false;
  private previousCount = 0;
  private previousType: SiteType | null = null;

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    what?: number,
    count?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strWhat = extractData(ds, "what");
      this.whatField = parseInt(strWhat, 10);
      const strCount = extractData(ds, "count");
      this.countField = parseInt(strCount, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.whatField = what!;
      this.countField = count!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];

    if (!this.alreadyApplied) {
      this.previousCount = cs.count(this.toSite, this.typeField);
      this.previousType = this.typeField;
      this.alreadyApplied = true;
    }

    cs.setSite(context.state(), this.toSite,
      (this.whatField < 1 ? 0 : context.components()[this.whatField].owner()),
      this.whatField, this.countField, -1, -1, -1, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    const t = this.previousType ?? (this.typeField ?? "Cell");
    const cid: number = t === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    cs.setSite(context.state(), this.toSite, -1, -1, this.previousCount, -1, -1, -1, t);
    return this;
  }

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetCount:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    sb += ",what=" + this.whatField;
    sb += ",count=" + this.countField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetCount"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "x" + this.countField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SetCount at " + this.toSite + " = " + this.countField + ")";
  }

  override to(): number { return this.toSite; }
  override what(): number { return this.whatField; }
  override count(): number { return this.countField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetCount"; }
}
