// @java Core/src/other/action/move/remove/ActionRemoveNonApplied.java ActionRemoveNonApplied
/**
 * Remove later a specific site (sequential capture).
 *
 * Faithful 1:1 transliteration of other.action.move.remove.ActionRemoveNonApplied.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";

export class ActionRemoveNonApplied extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly toSite: number;
  private typeField: SiteType | null;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().addSitesToRemove(this.toSite);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    context.state().removeSitesToRemove(this.toSite);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Remove:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    sb += ",applied=false";
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Remove"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Remove " + this.toSite + "(deferred)";
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(RemoveDeferred " + this.toSite + ")";
  }

  override to(): number { return this.toSite; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Remove"; }
}
