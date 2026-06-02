// @java Core/src/other/action/move/remove/ActionRemoveLevel.java ActionRemoveLevel
/**
 * Removes one component from a location and a specific level.
 *
 * Faithful 1:1 transliteration of other.action.move.remove.ActionRemoveLevel.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, LudiiContext, extractData, UNDEFINED } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";
import { ActionRemoveTopPiece } from "./ActionRemoveTopPiece.js";

export class ActionRemoveLevel extends ActionRemoveTopPiece {
  // -------------------------------------------------------------------------
  private readonly levelField: number;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    level?: number,
  ) {
    if (typeof typeOrDetailed === "string" && to === undefined) {
      super(typeOrDetailed);
      const ds = typeOrDetailed;
      const strLevel = extractData(ds, "level");
      this.levelField = strLevel === "" ? UNDEFINED : parseInt(strLevel, 10);
    } else {
      super(typeOrDetailed as SiteType | null, to);
      this.levelField = level!;
    }
  }

  override apply(context: LudiiContext, _store: boolean): Action {
    if (this.typeField === null) this.typeField = context.board().defaultSite();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];

    if (!this.alreadyApplied) {
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
      this.alreadyApplied = true;
    }

    const what: number = cs.what(this.toSite, this.levelField, this.typeField);
    const who: number = cs.who(this.toSite, this.levelField, this.typeField);
    cs.remove(context.state(), this.toSite, this.levelField, this.typeField);
    if (what !== 0) {
      context.state().owned().remove(who, what, this.toSite, this.typeField);
    }
    return this;
  }

  override toTrialFormat(context: LudiiContext | null): string {
    let sb = "[Remove:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",";
    }
    sb += "to=" + this.toSite;
    sb += ",level=" + this.levelField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  override levelTo(): number { return this.levelField; }

  override actionType(): ActionType { return "Remove"; }
}
