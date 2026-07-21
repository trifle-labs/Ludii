// @java Core/src/other/action/move/move/ActionMoveTopPiece.java ActionMoveTopPiece
/**
 * Moves a piece from a site to another (only the top piece).
 *
 * Faithful 1:1 transliteration of other.action.move.move.ActionMoveTopPiece.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED } from "../../Action.js";
import { ActionType } from "../../ActionType.js";
import { SiteType } from "../../SiteType.js";

export class ActionMoveTopPiece extends BaseAction {
  // -------------------------------------------------------------------------
  protected readonly typeFrom: SiteType;
  protected readonly fromSite: number;
  protected readonly typeToField: SiteType;
  protected readonly toSite: number;
  protected readonly stateField: number;
  protected readonly rotationField: number;
  protected readonly valueField: number;

  // Undo data
  protected alreadyApplied = false;
  protected previousWhatFrom: number[] = [];
  protected previousWhoFrom: number[] = [];
  protected previousStateFrom: number[] = [];
  protected previousRotationFrom: number[] = [];
  protected previousValueFrom: number[] = [];
  protected previousCountFrom = 0;
  protected previousWhatTo: number[] = [];
  protected previousWhoTo: number[] = [];
  protected previousStateTo: number[] = [];
  protected previousRotationTo: number[] = [];
  protected previousValueTo: number[] = [];
  protected previousCountTo = 0;
  // -------------------------------------------------------------------------

  constructor(
    typeFromOrDetailed: SiteType | null | string,
    from?: number,
    typeTo?: SiteType | null,
    to?: number,
    state?: number,
    rotation?: number,
    value?: number,
  ) {
    super();
    if (typeof typeFromOrDetailed === "string" && from === undefined) {
      const ds = typeFromOrDetailed;
      const strTF = extractData(ds, "typeFrom");
      this.typeFrom = strTF === "" ? "Cell" : (strTF as SiteType);
      const strFrom = extractData(ds, "from");
      this.fromSite = parseInt(strFrom, 10);
      const strTT = extractData(ds, "typeTo");
      this.typeToField = strTT === "" ? "Cell" : (strTT as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strState = extractData(ds, "state");
      this.stateField = strState === "" ? UNDEFINED : parseInt(strState, 10);
      const strRotation = extractData(ds, "rotation");
      this.rotationField = strRotation === "" ? UNDEFINED : parseInt(strRotation, 10);
      const strValue = extractData(ds, "value");
      this.valueField = strValue === "" ? UNDEFINED : parseInt(strValue, 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeFrom = (typeFromOrDetailed as SiteType | null) ?? "Cell";
      this.fromSite = from!;
      this.typeToField = typeTo != null ? typeTo : this.typeFrom;
      this.toSite = to!;
      this.stateField = state ?? UNDEFINED;
      this.rotationField = rotation ?? UNDEFINED;
      this.valueField = value ?? UNDEFINED;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeToField === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    if (!this.alreadyApplied) {
      this.snapshotFrom(csFrom, context);
      this.snapshotTo(csTo, context);
      this.alreadyApplied = true;
    }

    const what: number = csFrom.what(this.fromSite, this.typeFrom);
    const who: number = csFrom.who(this.fromSite, this.typeFrom);
    const stFrom: number = csFrom.state(this.fromSite, this.typeFrom);
    const rotFrom: number = csFrom.rotation(this.fromSite, this.typeFrom);
    const valFrom: number = csFrom.value(this.fromSite, this.typeFrom);

    // Clear from
    csFrom.setSite(context.state(), this.fromSite, 0, 0, 0, -1, -1, -1, this.typeFrom);
    // Place at to
    const effectiveState = this.stateField !== UNDEFINED ? this.stateField : stFrom;
    const effectiveRotation = this.rotationField !== UNDEFINED ? this.rotationField : rotFrom;
    const effectiveValue = this.valueField !== UNDEFINED ? this.valueField : valFrom;
    csTo.setSite(context.state(), this.toSite, who, what, 1,
      effectiveState, effectiveRotation, effectiveValue, this.typeToField);

    // Update owned cache
    if (what !== 0) {
      context.state().owned().remove(who, what, this.fromSite, this.typeFrom);
      context.state().owned().add(who, what, this.toSite, this.typeToField);
    }
    return this;
  }

  protected snapshotFrom(csFrom: LudiiContext, context: LudiiContext): void {
    this.previousCountFrom = csFrom.count(this.fromSite, this.typeFrom);
    this.previousWhatFrom = [csFrom.what(this.fromSite, 0, this.typeFrom)];
    this.previousWhoFrom = [csFrom.who(this.fromSite, 0, this.typeFrom)];
    this.previousStateFrom = [csFrom.state(this.fromSite, 0, this.typeFrom)];
    this.previousRotationFrom = [csFrom.rotation(this.fromSite, 0, this.typeFrom)];
    this.previousValueFrom = [csFrom.value(this.fromSite, 0, this.typeFrom)];
    void context; // unused but kept for subclass override signature
  }

  protected snapshotTo(csTo: LudiiContext, context: LudiiContext): void {
    this.previousCountTo = csTo.count(this.toSite, this.typeToField);
    this.previousWhatTo = [csTo.what(this.toSite, 0, this.typeToField)];
    this.previousWhoTo = [csTo.who(this.toSite, 0, this.typeToField)];
    this.previousStateTo = [csTo.state(this.toSite, 0, this.typeToField)];
    this.previousRotationTo = [csTo.rotation(this.toSite, 0, this.typeToField)];
    this.previousValueTo = [csTo.value(this.toSite, 0, this.typeToField)];
    void context;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    const contIDFrom = this.typeFrom === "Cell" ? context.containerId()[this.fromSite] : 0;
    const contIDTo = this.typeToField === "Cell" ? context.containerId()[this.toSite] : 0;
    const csFrom: LudiiContext = context.state().containerStates()[contIDFrom];
    const csTo: LudiiContext = context.state().containerStates()[contIDTo];

    csFrom.setSite(context.state(), this.fromSite,
      this.previousWhoFrom[0], this.previousWhatFrom[0], this.previousCountFrom,
      this.previousStateFrom[0], this.previousRotationFrom[0], this.previousValueFrom[0],
      this.typeFrom);
    csTo.setSite(context.state(), this.toSite,
      this.previousWhoTo[0], this.previousWhatTo[0], this.previousCountTo,
      this.previousStateTo[0], this.previousRotationTo[0], this.previousValueTo[0],
      this.typeToField);

    if (this.previousWhatFrom[0] !== 0) {
      context.state().owned().add(this.previousWhoFrom[0], this.previousWhatFrom[0], this.fromSite, this.typeFrom);
    }
    if (this.previousWhatTo[0] !== 0) {
      context.state().owned().remove(this.previousWhoFrom[0], this.previousWhatFrom[0], this.toSite, this.typeToField);
    }
    return this;
  }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Move:";
    sb += "typeFrom=" + this.typeFrom;
    sb += ",from=" + this.fromSite;
    sb += ",typeTo=" + this.typeToField;
    sb += ",to=" + this.toSite;
    if (this.stateField !== UNDEFINED) sb += ",state=" + this.stateField;
    if (this.rotationField !== UNDEFINED) sb += ",rotation=" + this.rotationField;
    if (this.valueField !== UNDEFINED) sb += ",value=" + this.valueField;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Move"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.fromSite + "->" + this.toSite;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Move from " + this.fromSite + " to " + this.toSite + ")";
  }

  override from(): number { return this.fromSite; }
  override to(): number { return this.toSite; }
  override fromType(): SiteType { return this.typeFrom; }
  override toType(): SiteType { return this.typeToField; }
  override state(): number { return this.stateField; }
  override rotation(): number { return this.rotationField; }
  override value(): number { return this.valueField; }

  override actionType(): ActionType { return "Move"; }
}
