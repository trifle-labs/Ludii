// @java Core/src/other/action/hidden/ActionSetHiddenRotation.java ActionSetHiddenRotation
/**
 * Sets the rotation hidden information to a graph element type at a specific level
 * for a specific player.
 *
 * Faithful 1:1 transliteration of other.action.hidden.ActionSetHiddenRotation.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED, GROUND_LEVEL } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetHiddenRotation extends BaseAction {
  private readonly toSite: number;
  private levelField: number = UNDEFINED;
  private readonly valueField: boolean;
  private readonly whoPlayer: number;
  private typeField: SiteType | null;

  private alreadyApplied = false;
  private previousValue = false;
  private previousType: SiteType | null = null;

  constructor(
    whoOrDetailed: number | string,
    type?: SiteType | null,
    to?: number,
    level?: number,
    value?: boolean,
  ) {
    super();
    if (typeof whoOrDetailed === "string") {
      const ds = whoOrDetailed;
      const strWho = extractData(ds, "who");
      this.whoPlayer = parseInt(strWho, 10);
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevel = extractData(ds, "level");
      this.levelField = strLevel === "" ? 0 : parseInt(strLevel, 10);
      const strValue = extractData(ds, "value");
      this.valueField = strValue === "true";
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.whoPlayer = whoOrDetailed;
      this.typeField = type ?? null;
      this.toSite = to!;
      this.levelField = level!;
      this.valueField = value!;
    }
  }

  apply(context: LudiiContext, _store: boolean): this {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    if (!this.alreadyApplied) {
      const cid: number = this.toSite >= context.containerId().length ? 0 : context.containerId()[this.toSite];
      const cs: LudiiContext = context.state().containerStates()[cid];
      this.previousValue = cs.isHiddenRotation(this.who, this.toSite, this.levelField, this.typeField);
      this.previousType = this.typeField;
      this.alreadyApplied = true;
    }
    context.containerState(context.containerId()[this.toSite])
      .setHiddenRotation(context.state(), this.who, this.toSite, this.levelField, this.typeField, this.valueField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): this {
    context.containerState(context.containerId()[this.toSite])
      .setHiddenRotation(context.state(), this.who, this.toSite, this.levelField, this.previousType, this.previousValue);
    return this;
  }

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetHiddenRotation:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",to=" + this.toSite;
    } else {
      sb += "to=" + this.toSite;
    }
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",who=" + this.who;
    sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetHiddenRotation"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + (this.levelField !== UNDEFINED ? "/" + this.levelField : "") +
      "P" + this.who + (this.valueField ? "=HiddenRotation" : "!=HiddenRotation");
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(HiddenRotation at " + this.toSite +
      (this.levelField !== UNDEFINED ? "/" + this.levelField : "") +
      " to P" + this.who + " = " + this.valueField + ")";
  }

  override from(): number { return this.toSite; }
  override to(): number { return this.toSite; }
  override levelFrom(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override levelTo(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override fromType(): SiteType { return this.typeField ?? "Cell"; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetHiddenRotation"; }
}
