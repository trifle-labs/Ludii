// @java Core/src/other/action/move/ActionPromote.java ActionPromote
/**
 * Promotes a piece to another piece.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionPromote.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED, GROUND_LEVEL } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionPromote extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly toSite: number;
  private levelField: number = UNDEFINED;
  private readonly newWhat: number;
  private typeField: SiteType | null;

  private alreadyApplied = false;
  private previousWhat = 0;
  private previousState = 0;
  private previousRotation = 0;
  private previousValue = 0;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    what?: number,
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
      const strWhat = extractData(ds, "what");
      this.newWhat = parseInt(strWhat, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.newWhat = what!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];

    if (!this.alreadyApplied) {
      const level: number = this.levelField === UNDEFINED ? cs.sizeStack(this.toSite, this.typeField) - 1 : this.levelField;
      this.previousWhat = cs.what(this.toSite, level, this.typeField);
      this.previousState = cs.state(this.toSite, level, this.typeField);
      this.previousRotation = cs.rotation(this.toSite, level, this.typeField);
      this.previousValue = cs.value(this.toSite, level, this.typeField);
      this.alreadyApplied = true;
    }

    const level: number = this.levelField === UNDEFINED ? cs.sizeStack(this.toSite, this.typeField) - 1 : this.levelField;
    const who: number = (this.newWhat < 1) ? 0 : context.components()[this.newWhat].owner();

    if (context.game().isStacking()) {
      cs.setSite(context.state(), this.toSite, who, this.newWhat, 1,
        this.previousState, this.previousRotation, this.previousValue, this.typeField);
    } else {
      cs.setSite(context.state(), this.toSite, who, this.newWhat,
        cs.count(this.toSite, this.typeField),
        this.previousState, this.previousRotation, this.previousValue, this.typeField);
    }
    // update owned cache
    if (this.previousWhat !== 0) {
      context.state().owned().remove(
        context.components()[this.previousWhat].owner(),
        this.previousWhat, this.toSite, this.typeField);
    }
    if (this.newWhat !== 0) {
      context.state().owned().add(who, this.newWhat, this.toSite, this.typeField);
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];

    const previousWho: number = (this.previousWhat < 1) ? 0 : context.components()[this.previousWhat].owner();
    cs.setSite(context.state(), this.toSite, previousWho, this.previousWhat,
      cs.count(this.toSite, this.typeField),
      this.previousState, this.previousRotation, this.previousValue, this.typeField);

    const newWho: number = (this.newWhat < 1) ? 0 : context.components()[this.newWhat].owner();
    context.state().owned().remove(newWho, this.newWhat, this.toSite, this.typeField);
    if (this.previousWhat !== 0) {
      context.state().owned().add(previousWho, this.previousWhat, this.toSite, this.typeField);
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Promote:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",what=" + this.newWhat;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Promote"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "=" + this.newWhat + "(promote)";
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Promote at " + this.toSite + " to " + this.newWhat + ")";
  }

  override to(): number { return this.toSite; }
  override levelTo(): number { return this.levelField === UNDEFINED ? GROUND_LEVEL : this.levelField; }
  override what(): number { return this.newWhat; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Promote"; }
}
