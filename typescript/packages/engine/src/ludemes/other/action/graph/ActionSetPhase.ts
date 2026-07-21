// @java Core/src/other/action/graph/ActionSetPhase.java ActionSetPhase
/**
 * Sets the phase of a graph element.
 *
 * Faithful 1:1 transliteration of other.action.graph.ActionSetPhase.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetPhase extends BaseAction {
  // -------------------------------------------------------------------------
  /** The site with the new phase. */
  private readonly toSite: number;
  /** The phase to set. */
  private readonly phase: number;
  /** The type of the graph element. */
  private typeField: SiteType | null;

  /** Guard: already applied. */
  private alreadyApplied = false;
  /** The previous phase. */
  private previousPhase = 0;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    phase?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const detailedString = typeOrDetailed;
      const strType = extractData(detailedString, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(detailedString, "to");
      this.toSite = parseInt(strTo, 10);
      const strPhase = extractData(detailedString, "phase");
      this.phase = parseInt(strPhase, 10);
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.phase = phase!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    if (!this.alreadyApplied) {
      this.previousPhase = context.topology().getGraphElements(this.typeField).get(this.toSite).phase();
      this.alreadyApplied = true;
    }
    context.topology().getGraphElements(this.typeField).get(this.toSite).setPhase(this.phase);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    context.topology().getGraphElements(this.typeField).get(this.toSite).setPhase(this.previousPhase);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetPhase:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField;
      sb += ",to=" + this.toSite;
    } else {
      sb += "to=" + this.toSite;
    }
    sb += ",phase=" + this.phase;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetPhase"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "=%" + this.phase;
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "(Phase at " + this.toSite + " = " + this.phase + ")";
  }

  override fromType(): SiteType { return this.typeField ?? "Cell"; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }
  override from(): number { return this.toSite; }
  override to(): number { return this.toSite; }

  override actionType(): ActionType { return "SetPhase"; }
}
