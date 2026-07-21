// @java Core/src/other/action/Action.java Action
/**
 * Action (or actions) making up a player move.
 *
 * Faithful 1:1 transliteration of other.action.Action (interface) and
 * other.action.BaseAction (abstract class).
 *
 * @author cambolbro and Eric.Piette  (Java original)
 */

import type { ActionType } from "./ActionType.js";
import type { SiteType } from "./SiteType.js";

// Java Constants mirrors
export const UNDEFINED = -1;
export const GROUND_LEVEL = 0;
export const NO_PIECE = 0;
export const DEFAULT_STATE = -1;
export const DEFAULT_ROTATION = -1;
export const NOBODY = 0;

/**
 * Minimal context surface used by the faithful transliterations.
 * The real engine context is in src/context.ts; this interface lets the
 * ludemes/other/action classes compile without importing the live engine.
 */
export interface LudiiContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** @java other.action.Action */
export interface Action {
  apply(context: LudiiContext, store: boolean): Action;
  undo(context: LudiiContext, discard: boolean): Action;

  isPass(): boolean;
  isForfeit(): boolean;
  isSwap(): boolean;
  isVote(): boolean;
  isForced(): boolean;
  isPropose(): boolean;
  isAlwaysGUILegal(): boolean;
  playerSelected(): number;
  containsNextInstance(): boolean;

  matchesUserMove(
    siteA: number,
    levelA: number,
    graphElementTypeA: SiteType,
    siteB: number,
    levelB: number,
    graphElementTypeB: SiteType,
  ): boolean;

  from(): number;
  levelFrom(): number;
  to(): number;
  levelTo(): number;
  who(): number;
  what(): number;
  state(): number;
  rotation(): number;
  value(): number;
  count(): number;
  proposition(): string | null;
  vote(): string | null;
  message(): string | null;
  isStacking(): boolean;
  hidden(): boolean[] | null;
  isDecision(): boolean;
  actionType(): ActionType | null;
  fromType(): SiteType;
  toType(): SiteType;
  setDecision(decision: boolean): void;
  withDecision(decision: boolean): Action;
  toTrialFormat(context: LudiiContext | null): string;
  toMoveFormat(context: LudiiContext | null, useCoords: boolean): string;
  getDescription(): string;
  toTurnFormat(context: LudiiContext | null, useCoords: boolean): string;
  setLevelFrom(levelA: number): void;
  setLevelTo(levelB: number): void;
  isOtherMove(): boolean;
}

/**
 * Static helper mirroring Action.extractData(detailedString, data).
 * @java other.action.Action#extractData
 */
export function extractData(detailedString: string, data: string): string {
  const fromIndex = detailedString.indexOf(data + "=");
  if (fromIndex < 0) return "";

  const beginData = detailedString.substring(fromIndex);

  // Special case for masked and invisible (which are arrays of data)
  if (data === "masked" || data === "invisible") {
    const afterData = beginData.substring(beginData.indexOf("=") + 1);
    let toSpecialIndex = afterData.indexOf("=");
    if (toSpecialIndex < 0) {
      return afterData.substring(0, afterData.length - 1);
    }
    while (afterData.charAt(toSpecialIndex) !== ",") toSpecialIndex--;
    return afterData.substring(0, toSpecialIndex);
  }

  let toIndex = beginData.indexOf(",");
  if (toIndex < 0) toIndex = beginData.indexOf("]");
  if (toIndex < 0) return "";

  return beginData.substring(beginData.indexOf("=") + 1, toIndex);
}

/**
 * Abstract base class providing default implementations.
 * @java other.action.BaseAction
 */
export abstract class BaseAction implements Action {
  /** decision action or not. */
  public decision = false;

  abstract apply(context: LudiiContext, store: boolean): Action;
  abstract undo(context: LudiiContext, discard: boolean): Action;
  abstract toTrialFormat(context: LudiiContext | null): string;
  abstract getDescription(): string;

  from(): number { return UNDEFINED; }
  fromType(): SiteType { return "Cell"; }
  levelFrom(): number { return GROUND_LEVEL; }

  to(): number { return UNDEFINED; }
  toType(): SiteType { return "Cell"; }
  levelTo(): number { return GROUND_LEVEL; }

  what(): number { return NO_PIECE; }
  state(): number { return DEFAULT_STATE; }
  rotation(): number { return DEFAULT_ROTATION; }
  value(): number { return DEFAULT_ROTATION; }
  count(): number { return NO_PIECE; }
  isStacking(): boolean { return false; }
  hidden(): boolean[] | null { return null; }
  who(): number { return NOBODY; }
  isDecision(): boolean { return this.decision; }
  isPass(): boolean { return false; }
  isForfeit(): boolean { return false; }
  isSwap(): boolean { return false; }
  isVote(): boolean { return false; }
  isPropose(): boolean { return false; }
  isAlwaysGUILegal(): boolean { return false; }
  proposition(): string | null { return null; }
  vote(): string | null { return null; }
  message(): string | null { return null; }
  isOtherMove(): boolean { return false; }
  isForced(): boolean { return false; }
  containsNextInstance(): boolean { return false; }
  playerSelected(): number { return UNDEFINED; }

  actionType(): ActionType | null { return null; }

  setDecision(decision: boolean): void { this.decision = decision; }
  withDecision(dec: boolean): Action { this.decision = dec; return this; }

  matchesUserMove(
    siteA: number,
    levelA: number,
    graphElementTypeA: SiteType,
    siteB: number,
    levelB: number,
    graphElementTypeB: SiteType,
  ): boolean {
    return (
      this.from() === siteA &&
      this.levelFrom() === levelA &&
      this.fromType() === graphElementTypeA &&
      this.to() === siteB &&
      this.levelTo() === levelB &&
      this.toType() === graphElementTypeB
    );
  }

  setLevelFrom(_levelA: number): void { /* do nothing in general */ }
  setLevelTo(_levelB: number): void { /* do nothing in general */ }

  toString(): string { return this.toTrialFormat(null); }

  toMoveFormat(context: LudiiContext | null, _useCoords: boolean): string {
    return this.toTrialFormat(context);
  }

  toTurnFormat(context: LudiiContext | null, _useCoords: boolean): string {
    return this.toTrialFormat(context);
  }
}
