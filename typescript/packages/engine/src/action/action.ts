/**
 * Java parity:
 * - Core/src/other/action/Action.java — the action interface.
 * - Core/src/other/action/BaseAction.java — default implementations
 *   (not read in this port; the TS `BaseAction` recreates the default
 *   behaviour the engine actually exercises).
 *
 * Faithful to the Java surface where the engine touches it; the
 * deferred surfaces are flagged in code comments rather than silently
 * stubbed.
 */

import type { SeededRng } from "../rng.js";
import type { State } from "../state.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

/** Sentinel for "no value" matching `Constants.UNDEFINED` in Java (-1). */
export const ACTION_UNDEFINED = -1;
/** Sentinel for "off" matching `Constants.OFF` in Java (-1). */
export const ACTION_OFF = -1;

/**
 * Per-player previous hidden-info snapshot — what each Action recorded
 * before applying, so it can be restored on undo. Java parity:
 * `ActionAdd.previousHidden*` family. The MVE doesn't yet use hidden
 * info in any compiled game; the fields are present so the API shape
 * matches Java and undo can be filled in later without breaking
 * callers.
 */
export interface PreviousHiddenSnapshot {
  readonly hidden?: readonly boolean[];
  readonly hiddenWhat?: readonly boolean[];
  readonly hiddenWho?: readonly boolean[];
  readonly hiddenState?: readonly boolean[];
  readonly hiddenRotation?: readonly boolean[];
  readonly hiddenValue?: readonly boolean[];
  readonly hiddenCount?: readonly boolean[];
}

/**
 * Action (or actions) making up a player move.
 *
 * This is the trimmed TS-shape of `other.action.Action`.
 */
export interface Action {
  /**
   * Apply this action to the given state, returning a new state. The
   * Java method mutates a `Context`; here the action is pure: it
   * derives a new immutable `State` from the input. A few stochastic
   * actions (dice rolls) consume the optional `rng`; deterministic
   * actions ignore it.
   */
  apply(state: State, rng?: SeededRng): State;

  // ---- ActionType / category --------------------------------------------

  actionType(): ActionType;
  isDecision(): boolean;
  withDecision(decision: boolean): Action;
  setDecision(decision: boolean): void;

  // ---- Java parity flags (defaults from BaseAction) ---------------------

  isPass(): boolean;
  isForfeit(): boolean;
  isSwap(): boolean;
  isVote(): boolean;
  isForced(): boolean;
  isPropose(): boolean;
  isStacking(): boolean;
  isOtherMove(): boolean;
  isAlwaysGUILegal(): boolean;
  containsNextInstance(): boolean;

  // ---- From / to / who / what -------------------------------------------

  from(): number;
  to(): number;
  levelFrom(): number;
  levelTo(): number;
  setLevelFrom(level: number): void;
  setLevelTo(level: number): void;

  who(): number;
  what(): number;
  state(): number;
  rotation(): number;
  value(): number;
  count(): number;
  playerSelected(): number;

  fromType(): SiteType;
  toType(): SiteType;

  // ---- Free-text bookkeeping --------------------------------------------

  proposition(): string;
  vote(): string;
  message(): string;
  getDescription(): string;

  /**
   * Java parity: `Action.getPreviousHidden*()` accessor family. Returns
   * the snapshot captured before this action was applied; `undefined`
   * means "no hidden-info state recorded" (the default for the MVE).
   */
  previousHidden(): PreviousHiddenSnapshot | undefined;
  setPreviousHidden(snapshot: PreviousHiddenSnapshot | undefined): void;
}

/**
 * Abstract base class providing the default returns that
 * `other.action.BaseAction` provides in Java. Concrete subclasses
 * override only the fields they actually use.
 */
export abstract class BaseAction implements Action {
  protected decision = false;
  protected levelFromValue = ACTION_UNDEFINED;
  protected levelToValue = ACTION_UNDEFINED;
  protected previousHiddenSnapshot: PreviousHiddenSnapshot | undefined;

  public abstract apply(state: State, rng?: SeededRng): State;
  public abstract actionType(): ActionType;

  public isDecision(): boolean {
    return this.decision;
  }

  public withDecision(decision: boolean): Action {
    this.decision = decision;
    return this;
  }

  public setDecision(decision: boolean): void {
    this.decision = decision;
  }

  public isPass(): boolean {
    return false;
  }
  public isForfeit(): boolean {
    return false;
  }
  public isSwap(): boolean {
    return false;
  }
  public isVote(): boolean {
    return false;
  }
  public isForced(): boolean {
    return false;
  }
  public isPropose(): boolean {
    return false;
  }
  public isStacking(): boolean {
    return false;
  }
  public isOtherMove(): boolean {
    return false;
  }
  public isAlwaysGUILegal(): boolean {
    return false;
  }
  public containsNextInstance(): boolean {
    return false;
  }

  public from(): number {
    return ACTION_UNDEFINED;
  }
  public to(): number {
    return ACTION_UNDEFINED;
  }
  public levelFrom(): number {
    return this.levelFromValue;
  }
  public levelTo(): number {
    return this.levelToValue;
  }
  public setLevelFrom(level: number): void {
    this.levelFromValue = level;
  }
  public setLevelTo(level: number): void {
    this.levelToValue = level;
  }

  public who(): number {
    return ACTION_UNDEFINED;
  }
  public what(): number {
    return ACTION_UNDEFINED;
  }
  public state(): number {
    return ACTION_UNDEFINED;
  }
  public rotation(): number {
    return ACTION_UNDEFINED;
  }
  public value(): number {
    return ACTION_UNDEFINED;
  }
  public count(): number {
    return 1;
  }
  public playerSelected(): number {
    return ACTION_UNDEFINED;
  }

  public fromType(): SiteType {
    return "Cell";
  }
  public toType(): SiteType {
    return "Cell";
  }

  public proposition(): string {
    return "";
  }
  public vote(): string {
    return "";
  }
  public message(): string {
    return "";
  }
  public getDescription(): string {
    return this.actionType();
  }

  public previousHidden(): PreviousHiddenSnapshot | undefined {
    return this.previousHiddenSnapshot;
  }

  public setPreviousHidden(snapshot: PreviousHiddenSnapshot | undefined): void {
    this.previousHiddenSnapshot = snapshot;
  }
}
