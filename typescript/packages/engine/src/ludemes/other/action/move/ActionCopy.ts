// @java Core/src/other/action/move/ActionCopy.java ActionCopy
/**
 * Copies a component from a site to another.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionCopy.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionCopy extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly typeFrom: SiteType | null;
  private readonly fromSite: number;
  private levelFromField: number;
  private typeToField: SiteType | null;
  private readonly toSite: number;
  private readonly levelToField: number;
  private readonly stateField: number;
  private readonly rotationField: number;
  private readonly valueField: number;
  private readonly onStacking: boolean;

  private alreadyApplied = false;
  private previousState = 0;
  private previousRotation = 0;
  private previousValue = 0;
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
    onStacking?: boolean,
  ) {
    super();
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      const ds = typeFromOrDetailed;
      const strTypeFrom = extractData(ds, "typeFrom");
      this.typeFrom = strTypeFrom === "" ? null : (strTypeFrom as SiteType);
      const strFrom = extractData(ds, "from");
      this.fromSite = parseInt(strFrom, 10);
      const strLevelFrom = extractData(ds, "levelFrom");
      this.levelFromField = strLevelFrom === "" ? UNDEFINED : parseInt(strLevelFrom, 10);
      const strTypeTo = extractData(ds, "typeTo");
      this.typeToField = strTypeTo === "" ? null : (strTypeTo as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevelTo = extractData(ds, "levelTo");
      this.levelToField = strLevelTo === "" ? UNDEFINED : parseInt(strLevelTo, 10);
      const strState = extractData(ds, "state");
      this.stateField = strState === "" ? UNDEFINED : parseInt(strState, 10);
      const strRotation = extractData(ds, "rotation");
      this.rotationField = strRotation === "" ? UNDEFINED : parseInt(strRotation, 10);
      const strValue = extractData(ds, "value");
      this.valueField = strValue === "" ? UNDEFINED : parseInt(strValue, 10);
      const strStack = extractData(ds, "stack");
      this.onStacking = strStack === "" ? false : strStack === "true";
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeFrom = typeFromOrDetailed as SiteType | null;
      this.fromSite = from!;
      this.levelFromField = levelFrom!;
      this.typeToField = typeTo ?? null;
      this.toSite = to!;
      this.levelToField = levelTo!;
      this.stateField = state!;
      this.rotationField = rotation!;
      this.valueField = value!;
      this.onStacking = onStacking ?? false;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    const typeFrom = this.typeFrom ?? context.board().defaultSite();
    const typeTo = this.typeToField ?? typeFrom;

    const contIDFrom = typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      this.previousState = csTo.state(this.toSite, typeTo);
      this.previousRotation = csTo.rotation(this.toSite, typeTo);
      this.previousValue = csTo.value(this.toSite, typeTo);
      this.alreadyApplied = true;
    }

    const what: number = csFrom.what(this.fromSite, typeFrom);
    const who: number = csFrom.who(this.fromSite, typeFrom);
    const effectiveState: number = this.stateField !== UNDEFINED ? this.stateField : csFrom.state(this.fromSite, typeFrom);
    const effectiveRotation: number = this.rotationField !== UNDEFINED ? this.rotationField : csFrom.rotation(this.fromSite, typeFrom);
    const effectiveValue: number = this.valueField !== UNDEFINED ? this.valueField : csFrom.value(this.fromSite, typeFrom);

    csTo.setSite(context.state(), this.toSite, who, what, 1,
      effectiveState, effectiveRotation, effectiveValue, typeTo);
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    const typeTo = this.typeToField ?? (this.typeFrom ?? context.board().defaultSite());
    const contIDTo = typeTo === "Cell" ? context.containerId()[this.toSite] : 0;
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];
    csTo.setSite(context.state(), this.toSite, 0, 0, 0,
      this.previousState, this.previousRotation, this.previousValue, typeTo);
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Copy:";
    if (this.typeFrom !== null) sb += "typeFrom=" + this.typeFrom + ",";
    sb += "from=" + this.fromSite;
    if (this.levelFromField !== UNDEFINED) sb += ",levelFrom=" + this.levelFromField;
    if (this.typeToField !== null) sb += ",typeTo=" + this.typeToField;
    sb += ",to=" + this.toSite;
    if (this.levelToField !== UNDEFINED) sb += ",levelTo=" + this.levelToField;
    if (this.stateField !== UNDEFINED) sb += ",state=" + this.stateField;
    if (this.rotationField !== UNDEFINED) sb += ",rotation=" + this.rotationField;
    if (this.valueField !== UNDEFINED) sb += ",value=" + this.valueField;
    if (this.onStacking) sb += ",stack=" + this.onStacking;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Copy"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.fromSite + "->" + this.toSite + "(copy)";
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Copy from " + this.fromSite + " to " + this.toSite + ")";
  }

  override from(): number { return this.fromSite; }
  override to(): number { return this.toSite; }
  override levelFrom(): number { return this.levelFromField; }
  override levelTo(): number { return this.levelToField; }
  override fromType(): SiteType { return this.typeFrom ?? "Cell"; }
  override toType(): SiteType { return this.typeToField ?? "Cell"; }
  override state(): number { return this.stateField; }
  override rotation(): number { return this.rotationField; }
  override value(): number { return this.valueField; }
  override isStacking(): boolean { return this.onStacking; }

  override actionType(): ActionType { return "Copy"; }
}
