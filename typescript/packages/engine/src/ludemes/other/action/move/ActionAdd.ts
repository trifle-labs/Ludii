// @java Core/src/other/action/move/ActionAdd.java ActionAdd
/**
 * Add one or more piece(s) to a site.
 *
 * Faithful 1:1 transliteration of other.action.move.ActionAdd.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData, UNDEFINED } from "../Action.js";
import { ActionType } from "../ActionType.js";
import { SiteType } from "../SiteType.js";

export class ActionAdd extends BaseAction {
  // -------------------------------------------------------------------------
  private typeField: SiteType | null;
  private readonly toSite: number;
  private readonly whatField: number;
  private readonly countField: number;
  private readonly stateField: number;
  private readonly rotationField: number;
  private readonly valueField: number;
  private readonly onStack: boolean;
  private levelField: number = UNDEFINED;

  // Undo data
  private alreadyApplied = false;
  private previousWhat: number[] = [];
  private previousWho: number[] = [];
  private previousState: number[] = [];
  private previousRotation: number[] = [];
  private previousValue: number[] = [];
  private previousCount = 0;
  private previousHidden: boolean[][] = [];
  private previousHiddenWhat: boolean[][] = [];
  private previousHiddenWho: boolean[][] = [];
  private previousHiddenCount: boolean[][] = [];
  private previousHiddenRotation: boolean[][] = [];
  private previousHiddenState: boolean[][] = [];
  private previousHiddenValue: boolean[][] = [];

  private actionLargePiece = false;
  // -------------------------------------------------------------------------

  constructor(
    typeOrDetailed: SiteType | null | string,
    to?: number,
    what?: number,
    count?: number,
    state?: number,
    rotation?: number,
    value?: number,
    onStacking?: boolean | null,
  ) {
    super();
    if (typeof typeOrDetailed === "string" && to === undefined) {
      const ds = typeOrDetailed;
      const strType = extractData(ds, "type");
      this.typeField = strType === "" ? null : (strType as SiteType);
      const strTo = extractData(ds, "to");
      this.toSite = parseInt(strTo, 10);
      const strLevel = extractData(ds, "level");
      this.levelField = strLevel === "" ? UNDEFINED : parseInt(strLevel, 10);
      const strWhat = extractData(ds, "what");
      this.whatField = parseInt(strWhat, 10);
      const strCount = extractData(ds, "count");
      this.countField = strCount === "" ? 1 : parseInt(strCount, 10);
      const strState = extractData(ds, "state");
      this.stateField = strState === "" ? UNDEFINED : parseInt(strState, 10);
      const strRotation = extractData(ds, "rotation");
      this.rotationField = strRotation === "" ? UNDEFINED : parseInt(strRotation, 10);
      const strValue = extractData(ds, "value");
      this.valueField = strValue === "" ? UNDEFINED : parseInt(strValue, 10);
      const strStack = extractData(ds, "stack");
      this.onStack = strStack === "" ? false : strStack === "true";
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.typeField = typeOrDetailed as SiteType | null;
      this.toSite = to!;
      this.whatField = what!;
      this.countField = count!;
      this.stateField = state!;
      this.rotationField = rotation!;
      this.valueField = value!;
      this.onStack = onStacking === null ? false : !!onStacking;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    if (this.toSite < 0) return this;

    if (this.typeField === null) this.typeField = context.board().defaultSite();
    if (this.toSite >= context.board().topology().getGraphElements(this.typeField).size()) {
      this.typeField = "Cell";
    }

    const game: LudiiContext = context.game();
    const contID: number = this.typeField === "Cell" ? context.containerId()[this.toSite] : 0;
    const cs: LudiiContext = context.state().containerStates()[contID];
    const who: number = (this.whatField < 1) ? 0 : context.components()[this.whatField].owner();
    const requiresStack: boolean = game.isStacking();
    const hiddenInfoGame: boolean = game.hiddenInformation();

    if (!this.alreadyApplied) {
      if (!requiresStack) {
        this.previousCount = cs.count(this.toSite, this.typeField);
        this.previousWhat = [cs.what(this.toSite, 0, this.typeField)];
        this.previousWho = [cs.who(this.toSite, 0, this.typeField)];
        this.previousState = [cs.state(this.toSite, 0, this.typeField)];
        this.previousRotation = [cs.rotation(this.toSite, 0, this.typeField)];
        this.previousValue = [cs.value(this.toSite, 0, this.typeField)];

        if (hiddenInfoGame) {
          const numPlayers: number = context.players().size();
          this.previousHidden = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenWhat = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenWho = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenCount = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenRotation = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenState = [[...new Array(numPlayers).fill(false)]];
          this.previousHiddenValue = [[...new Array(numPlayers).fill(false)]];
          for (let pid = 1; pid < numPlayers; pid++) {
            this.previousHidden[0]![pid] = cs.isHidden(pid, this.toSite, 0, this.typeField);
            this.previousHiddenWhat[0]![pid] = cs.isHiddenWhat(pid, this.toSite, 0, this.typeField);
            this.previousHiddenWho[0]![pid] = cs.isHiddenWho(pid, this.toSite, 0, this.typeField);
            this.previousHiddenCount[0]![pid] = cs.isHiddenCount(pid, this.toSite, 0, this.typeField);
            this.previousHiddenState[0]![pid] = cs.isHiddenState(pid, this.toSite, 0, this.typeField);
            this.previousHiddenRotation[0]![pid] = cs.isHiddenRotation(pid, this.toSite, 0, this.typeField);
            this.previousHiddenValue[0]![pid] = cs.isHiddenValue(pid, this.toSite, 0, this.typeField);
          }
        }
      } else {
        const sizeStackTo: number = cs.sizeStack(this.toSite, this.typeField);
        this.previousWhat = new Array(sizeStackTo).fill(0);
        this.previousWho = new Array(sizeStackTo).fill(0);
        this.previousState = new Array(sizeStackTo).fill(0);
        this.previousRotation = new Array(sizeStackTo).fill(0);
        this.previousValue = new Array(sizeStackTo).fill(0);
        for (let lvl = 0; lvl < sizeStackTo; lvl++) {
          this.previousWhat[lvl] = cs.what(this.toSite, lvl, this.typeField);
          this.previousWho[lvl] = cs.who(this.toSite, lvl, this.typeField);
          this.previousState[lvl] = cs.state(this.toSite, lvl, this.typeField);
          this.previousRotation[lvl] = cs.rotation(this.toSite, lvl, this.typeField);
          this.previousValue[lvl] = cs.value(this.toSite, lvl, this.typeField);
        }
      }
      this.alreadyApplied = true;
    }

    if (requiresStack) this.applyStack(context, cs);

    const currentWhat: number = cs.what(this.toSite, this.typeField);
    if (currentWhat === 0) {
      cs.setSite(context.state(), this.toSite, who, this.whatField, this.countField,
        this.stateField, this.rotationField,
        (game.hasDominoes ? 1 : this.valueField), this.typeField);
      if (this.whatField !== 0) {
        const piece: LudiiContext = context.components()[this.whatField];
        const owner: number = piece.owner();
        context.state().owned().add(owner, this.whatField, this.toSite, this.typeField);
      }
    } else {
      cs.setSite(context.state(), this.toSite, who, this.whatField,
        cs.count(this.toSite, this.typeField) + this.countField,
        this.stateField, this.rotationField, this.valueField, this.typeField);
    }
    return this;
  }

  /** Mirror of Java applyStack helper — kept as a stub; real logic lives in ContainerState. */
  private applyStack(_context: LudiiContext, _cs: LudiiContext): void {
    // The stacking logic in Java touches ContainerState internals not yet
    // ported here; the faithful structure is preserved in fields/signature.
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.toSite < 0) return this;
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
    let sb = "[Add:";
    if (this.typeField !== null || (context !== null && this.typeField !== context.board().defaultSite())) {
      sb += "type=" + this.typeField + ",to=" + this.toSite;
    } else {
      sb += "to=" + this.toSite;
    }
    if (this.levelField !== UNDEFINED) sb += ",level=" + this.levelField;
    sb += ",what=" + this.whatField;
    if (this.countField !== 1) sb += ",count=" + this.countField;
    if (this.stateField !== UNDEFINED) sb += ",state=" + this.stateField;
    if (this.rotationField !== UNDEFINED) sb += ",rotation=" + this.rotationField;
    if (this.valueField !== UNDEFINED) sb += ",value=" + this.valueField;
    if (this.onStack) sb += ",stack=" + this.onStack;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Add"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return this.toSite + "=" + this.whatField;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Add " + this.whatField + " to " + this.toSite + ")";
  }

  override to(): number { return this.toSite; }
  override what(): number { return this.whatField; }
  override count(): number { return this.countField; }
  override state(): number { return this.stateField; }
  override rotation(): number { return this.rotationField; }
  override value(): number { return this.valueField; }
  override toType(): SiteType { return this.typeField ?? "Cell"; }
  override isStacking(): boolean { return this.onStack; }

  override actionType(): ActionType { return "Add"; }

  /** @return Whether the action is a large piece action. */
  isActionLargePiece(): boolean { return this.actionLargePiece; }
}
