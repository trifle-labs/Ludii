// @java Core/src/other/action/state/ActionSetRotation.java ActionSetRotation
/**
 * Sets the rotation of a piece.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetRotation.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED, GROUND_LEVEL } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetRotation extends BaseAction {
  private readonly toSite: number;
  private readonly levelField: number;
  private readonly rotationField: number;
  private typeField: SiteType | null;
  private alreadyApplied = false;
  private previousRotation = 0;

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    level?: number,
    rotation?: number,
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
      const strRotation = extractData(ds, "rotation");
      this.rotationField = parseInt(strRotation, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.levelField = level ?? UNDEFINED;
      this.rotationField = rotation!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    const level = this.levelField === UNDEFINED ? 0 : this.levelField;

    if (!this.alreadyApplied) {
      this.previousRotation = cs.rotation(this.toSite, level, this.typeField);
      this.alreadyApplied = true;
    }

    cs.setSite(context.state(), this.toSite, -1, -1, -1, -1, this.rotationField, -1, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    cs.setSite(context.state(), this.toSite, -1, -1, -1, -1, this.previousRotation, -1, this.typeField);
    return this;
  }

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetRotation:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",rotation=" + this.rotationField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetRotation"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "~" + this.rotationField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SetRotation at " + this.toSite + " = " + this.rotationField + ")";
  }

  override to(): number { return this.toSite; }
  override levelTo(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override rotation(): number { return this.rotationField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetRotation"; }
}
