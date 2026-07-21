// @java Core/src/other/action/graph/ActionSetCost.java ActionSetCost
/**
 * Sets the cost of a graph element.
 *
 * Faithful 1:1 transliteration of other.action.graph.ActionSetCost.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSetCost extends BaseAction {
  // -------------------------------------------------------------------------
  /** The index of the graph element. */
  private readonly toSite: number;
  /** The cost to set. */
  private readonly cost: number;
  /** The type of the graph element. */
  private typeField: SiteType | null;

  /** Guard: already applied. */
  private alreadyApplied = false;
  /** The previous cost. */
  private previousCost = 0;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    cost?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const detailedString = typeOrDetailed;
      const strType = extractData(detailedString, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(detailedString, "to");
      this.toSite = parseInt(strTo, 10);
      const strCost = extractData(detailedString, "cost");
      this.cost = parseInt(strCost, 10);
      const strDecision = extractData(detailedString, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.cost = cost!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    if (!this.alreadyApplied) {
      this.previousCost = context.topology().getGraphElements(this.typeField).get(this.toSite).cost();
      this.alreadyApplied = true;
    }
    context.topology().getGraphElements(this.typeField).get(this.toSite).setCost(this.cost);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    context.topology().getGraphElements(this.typeField).get(this.toSite).setCost(this.previousCost);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[SetCost:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField;
      sb += ",to=" + this.toSite;
    } else {
      sb += "to=" + this.toSite;
    }
    sb += ",cost=" + this.cost;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "SetCost"; }

  override toTurnFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "=$" + this.cost;
  }

  override toMoveFormat(_context: LudiiContext | null, _useCoords: boolean): string {
    return "(Cost at " + this.toSite + " = " + this.cost + ")";
  }

  override from(): number { return this.toSite; }
  override to(): number { return this.toSite; }
  override fromType(): SiteType { return this.typeField ?? "Cell"; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "SetCost"; }
}
