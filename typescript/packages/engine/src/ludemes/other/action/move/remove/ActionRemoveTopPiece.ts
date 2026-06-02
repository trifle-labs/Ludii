// @java Core/src/other/action/move/remove/ActionRemoveTopPiece.java ActionRemoveTopPiece
/**
 * Removes one or more component(s) from a location (always the top piece).
 *
 * Faithful 1:1 transliteration of other.action.move.remove.ActionRemoveTopPiece.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";

export class ActionRemoveTopPiece extends BaseAction {
  // -------------------------------------------------------------------------
  protected readonly toSite: number;
  protected typeField: SiteType | null;

  protected alreadyApplied = false;
  protected previousWhat: number[] = [];
  protected previousWho: number[] = [];
  protected previousState: number[] = [];
  protected previousRotation: number[] = [];
  protected previousValue: number[] = [];
  protected previousCount = 0;
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
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];
    const requiresStack: boolean = context.game().isStacking();

    if (!this.alreadyApplied) {
      if (!requiresStack) {
        this.previousCount = cs.count(this.toSite, this.typeField);
        this.previousWhat = [cs.what(this.toSite, 0, this.typeField)];
        this.previousWho = [cs.who(this.toSite, 0, this.typeField)];
        this.previousState = [cs.state(this.toSite, 0, this.typeField)];
        this.previousRotation = [cs.rotation(this.toSite, 0, this.typeField)];
        this.previousValue = [cs.value(this.toSite, 0, this.typeField)];
      } else {
        const sz: number = cs.sizeStack(this.toSite, this.typeField);
        this.previousWhat = new Array(sz).fill(0);
        this.previousWho = new Array(sz).fill(0);
        this.previousState = new Array(sz).fill(0);
        this.previousRotation = new Array(sz).fill(0);
        this.previousValue = new Array(sz).fill(0);
        for (let lvl = 0; lvl < sz; lvl++) {
          this.previousWhat[lvl] = cs.what(this.toSite, lvl, this.typeField);
          this.previousWho[lvl] = cs.who(this.toSite, lvl, this.typeField);
          this.previousState[lvl] = cs.state(this.toSite, lvl, this.typeField);
          this.previousRotation[lvl] = cs.rotation(this.toSite, lvl, this.typeField);
          this.previousValue[lvl] = cs.value(this.toSite, lvl, this.typeField);
        }
      }
      this.alreadyApplied = true;
    }

    const what: number = cs.what(this.toSite, this.typeField);
    const who: number = cs.who(this.toSite, this.typeField);
    cs.setSite(context.state(), this.toSite, 0, 0, 0, -1, -1, -1, this.typeField);
    if (what !== 0) {
      context.state().owned().remove(who, what, this.toSite, this.typeField);
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];
    const requiresStack: boolean = context.game().isStacking();

    if (!requiresStack) {
      cs.setSite(context.state(), this.toSite,
        this.previousWho[0], this.previousWhat[0], this.previousCount,
        this.previousState[0], this.previousRotation[0], this.previousValue[0],
        this.typeField);
    } else {
      cs.setSize(context.state(), this.toSite, this.previousWhat.length, this.typeField);
      for (let lvl = 0; lvl < this.previousWhat.length; lvl++) {
        cs.setSite(context.state(), this.toSite,
          this.previousWho[lvl], this.previousWhat[lvl], 1,
          this.previousState[lvl], this.previousRotation[lvl], this.previousValue[lvl],
          this.typeField);
      }
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Remove:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Remove"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Remove " + this.toSite;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Remove from " + this.toSite + ")";
  }

  override to(): number { return this.toSite; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }

  override actionType(): ActionType { return "Remove"; }
}
