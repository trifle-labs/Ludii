// @java Core/src/other/action/move/ActionSelect.java ActionSelect
/**
 * Selects the from/to sites of the move.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionSelect.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionSelect extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly fromSite: number;
  private readonly toSite: number;
  private readonly levelFromField: number;
  private readonly levelToField: number;
  private readonly typeFromField: SiteType;
  private readonly typeToField: SiteType;
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | string,
    from?: number,
    levelFrom?: number,
    typeTo?: SiteType | null,
    to?: number,
    levelTo?: number,
  ) {
    super();
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      const ds = typeFromOrDetailed;
      const strTypeFrom = extractData(ds, "typeFrom");
      this.typeFromField = strTypeFrom === "" ? "Cell" : (strTypeFrom as SiteType);
      const strFrom = extractData(ds, "from");
      this.fromSite = parseInt(strFrom, 10);
      const strLevelFrom = extractData(ds, "levelFrom");
      this.levelFromField = strLevelFrom === "" ? UNDEFINED : parseInt(strLevelFrom, 10);
      const strTypeTo = extractData(ds, "typeTo");
      this.typeToField = strTypeTo === "" ? this.typeFromField : (strTypeTo as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = strTo === "" ? UNDEFINED : parseInt(strTo, 10);
      const strLevelTo = extractData(ds, "levelTo");
      this.levelToField = strLevelTo === "" ? UNDEFINED : parseInt(strLevelTo, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeFromField = typeFromOrDetailed as SiteType;
      this.fromSite = from!;
      this.levelFromField = levelFrom!;
      this.typeToField = (typeTo !== null && typeTo !== undefined) ? typeTo : this.typeFromField;
      this.toSite = to!;
      this.levelToField = levelTo!;
    }
  }

  // -------------------------------------------------------------------------

  apply(_context: LudiiContext, _store: boolean): Action {
    // ActionSelect is a bookkeeping action — it records the selected sites but
    // does not mutate the board state. Nothing to do.
    return this;
  }

  undo(_context: LudiiContext, _discard: boolean): Action {
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Select:";
    sb += "typeFrom=" + this.typeFromField;
    sb += ",from=" + this.fromSite;
    if (this.levelFromField !== UNDEFINED) sb += ",levelFrom=" + this.levelFromField;
    sb += ",typeTo=" + this.typeToField;
    if (this.toSite !== UNDEFINED) sb += ",to=" + this.toSite;
    if (this.levelToField !== UNDEFINED) sb += ",levelTo=" + this.levelToField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Select"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.fromSite + "->" + this.toSite;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Select from " + this.fromSite + " to " + this.toSite + ")";
  }

  override from(): number { return this.fromSite; }
  override to(): number { return this.toSite; }
  override levelFrom(): number { return this.levelFromField; }
  override levelTo(): number { return this.levelToField; }
  override fromType(): SiteType { return this.typeFromField; }
  override toType(): SiteType { return this.typeToField; }

  override actionType(): ActionType { return "Select"; }
}
