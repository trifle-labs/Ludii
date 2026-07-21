// @java Core/src/other/action/move/move/ActionMoveLevelFromLevelTo.java ActionMoveLevelFromLevelTo
/**
 * Moves a piece from a site at a specific level to another site at a specific level.
 *
 * Faithful 1:1 transliteration of other.action.move.move.ActionMoveLevelFromLevelTo.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, LudiiContext, extractData, UNDEFINED } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";
import { ActionMoveTopPiece } from "./ActionMoveTopPiece.js";

export class ActionMoveLevelFromLevelTo extends ActionMoveTopPiece {
  // -------------------------------------------------------------------------
  private levelFromField: number;
  private levelToField: number;
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | null | string,
    from?: number,
    levelFrom?: number,
    typeTo?: SiteType | null,
    to?: number,
    levelTo?: number,
    state?: number,
    rotation?: number,
    value?: number,
  ) {
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      super(typeFromOrDetailed);
      const ds = typeFromOrDetailed;
      const strLevelFrom = extractData(ds, "levelFrom");
      this.levelFromField = strLevelFrom === "" ? UNDEFINED : parseInt(strLevelFrom, 10);
      const strLevelTo = extractData(ds, "levelTo");
      this.levelToField = strLevelTo === "" ? UNDEFINED : parseInt(strLevelTo, 10);
    } else {
      super(typeFromOrDetailed as SiteType | null, from, typeTo, to, state, rotation, value);
      this.levelFromField = levelFrom!;
      this.levelToField = levelTo!;
    }
  }

  override apply(context: LudiiContext, _store: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeToField === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      this.snapshotFrom(csFrom, context);
      this.snapshotTo(csTo, context);
      this.alreadyApplied = true;
    }

    const what: number = csFrom.what(this.fromSite, this.levelFromField, this.typeFrom);
    const who: number = csFrom.who(this.fromSite, this.levelFromField, this.typeFrom);
    const stFrom: number = csFrom.state(this.fromSite, this.levelFromField, this.typeFrom);
    const rotFrom: number = csFrom.rotation(this.fromSite, this.levelFromField, this.typeFrom);
    const valFrom: number = csFrom.value(this.fromSite, this.levelFromField, this.typeFrom);

    csFrom.remove(context.state(), this.fromSite, this.levelFromField, this.typeFrom);

    const effectiveState = this.stateField !== UNDEFINED ? this.stateField : stFrom;
    const effectiveRotation = this.rotationField !== UNDEFINED ? this.rotationField : rotFrom;
    const effectiveValue = this.valueField !== UNDEFINED ? this.valueField : valFrom;
    csTo.insert(context.state(), this.toSite, this.levelToField, what, effectiveState, this.typeToField);
    csTo.setSite(context.state(), this.toSite, who, what, 1,
      effectiveState, effectiveRotation, effectiveValue, this.typeToField);

    if (what !== 0) {
      context.state().owned().remove(who, what, this.fromSite, this.typeFrom);
      context.state().owned().add(who, what, this.toSite, this.typeToField);
    }
    return this;
  }

  override toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Move:";
    sb += "typeFrom=" + this.typeFrom;
    sb += ",from=" + this.fromSite;
    sb += ",levelFrom=" + this.levelFromField;
    sb += ",typeTo=" + this.typeToField;
    sb += ",to=" + this.toSite;
    sb += ",levelTo=" + this.levelToField;
    if (this.stateField !== UNDEFINED) sb += ",state=" + this.stateField;
    if (this.rotationField !== UNDEFINED) sb += ",rotation=" + this.rotationField;
    if (this.valueField !== UNDEFINED) sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  override levelFrom(): number { return this.levelFromField; }
  override levelTo(): number { return this.levelToField; }
  override setLevelFrom(levelA: number): void { this.levelFromField = levelA; }
  override setLevelTo(levelB: number): void { this.levelToField = levelB; }

  override actionType(): ActionType { return "Move"; }
}
