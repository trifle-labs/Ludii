// @java Core/src/other/action/puzzle/ActionReset.java ActionReset
/**
 * Resets all the values of a variable to not set in a deduction puzzle.
 *
 * Faithful 1:1 transliteration of other.action.puzzle.ActionReset.
 *
 * @author Matthew.Stephenson and Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionReset extends BaseAction {
  // -------------------------------------------------------------------------
  private typeField: SiteType | null;
  private readonly varIndex: number;
  private readonly max: number;

  private alreadyApplied = false;
  private previousValues: boolean[] = [];
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    varArg?: number,
    max?: number,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && varArg === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strVar = extractData(ds, "var");
      this.varIndex = parseInt(strVar, 10);
      const strMax = extractData(ds, "max");
      this.max = parseInt(strMax, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.varIndex = varArg!;
      this.max = max!;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.varIndex] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    const pcs: LudiiContext = cs; // ContainerDeductionPuzzleState surface

    if (!this.alreadyApplied) {
      this.previousValues = new Array(this.max + 1).fill(false);
      for (let v = 1; v <= this.max; v++) {
        this.previousValues[v] = pcs.isPossible(this.varIndex, v, this.typeField);
      }
      this.alreadyApplied = true;
    }

    for (let v = 1; v <= this.max; v++) {
      pcs.setPossible(context.state(), this.varIndex, v, true, this.typeField);
    }
    pcs.setResolved(context.state(), this.varIndex, false, this.typeField);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const cid: number = this.typeField === "Cell" ? context.containerId()[this.varIndex] : 0;
    const cs: LudiiContext = context.state().containerStates()[cid];
    const pcs: LudiiContext = cs;

    for (let v = 1; v <= this.max; v++) {
      pcs.setPossible(context.state(), this.varIndex, v, this.previousValues[v], this.typeField);
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Reset:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "var=" + this.varIndex;
    sb += ",max=" + this.max;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Reset"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Reset " + this.varIndex;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Reset var=" + this.varIndex + ")";
  }

  override to(): number { return this.varIndex; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Reset"; }
}
