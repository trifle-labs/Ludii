// @java Core/src/other/action/state/ActionSetState.java ActionSetState
/**
 * Sets the local state of a piece.
 *
 * Faithful 1:1 transliteration of other.action.state.ActionSetState.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED, GROUND_LEVEL } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetState extends BaseAction {
  private readonly toSite: number;
  private readonly levelField: number;
  private readonly stateField: number;
  private typeField: SiteType | null;
  private alreadyApplied = false;
  private previousState = 0;

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    level?: number,
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
      this.levelField = strLevel === "" ? UNDEFINED : parseInt(strLevel, 10);
      const strState = extractData(ds, "state");
      this.stateField = parseInt(strState, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.levelField = level ?? UNDEFINED;
      this.stateField = state!;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    const level = this.levelField === UNDEFINED ? 0 : this.levelField;

    if (!this.alreadyApplied) {
      this.previousState = cs.state(this.toSite, level, this.typeField);
      this.alreadyApplied = true;
    }

    cs.setSite(context.state(), this.toSite, -1, -1, -1, this.stateField, -1, -1, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    cs.setSite(context.state(), this.toSite, -1, -1, -1, this.previousState, -1, -1, this.typeField);
    return this;
  }

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetState:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",state=" + this.stateField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetState"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "(state=" + this.stateField + ")";
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(SetState at " + this.toSite + " = " + this.stateField + ")";
  }

  override to(): number { return this.toSite; }
  override levelTo(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override state(): number { return this.stateField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetState"; }
}
