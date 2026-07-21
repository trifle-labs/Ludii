// @java Core/src/other/action/move/move/ActionMove.java ActionMove
/**
 * Factory that dispatches to the correct ActionMove* subclass.
 *
 * Faithful 1:1 transliteration of other.action.move.move.ActionMove.
 *
 * @author Eric.Piette  (Java original)
 */

import { BaseAction, extractData, LudiiContext, UNDEFINED } from "../../Action.js";
import { SiteType } from "../../SiteType.js";
import { ActionMoveLevelFrom } from "./ActionMoveLevelFrom.js";
import { ActionMoveLevelFromLevelTo } from "./ActionMoveLevelFromLevelTo.js";
import { ActionMoveLevelTo } from "./ActionMoveLevelTo.js";
import { ActionMoveStacking } from "./ActionMoveStacking.js";
import { ActionMoveTopPiece } from "./ActionMoveTopPiece.js";

/** @java other.action.move.move.ActionMove#construct */
export function constructActionMove(
  typeFrom: SiteType | null,
  from: number,
  levelFrom: number,
  typeTo: SiteType | null,
  to: number,
  levelTo: number,
  state: number,
  rotation: number,
  value: number,
  onStacking: boolean,
  decision?: boolean,
): BaseAction {
  let result: BaseAction;
  if (onStacking) {
    result = new ActionMoveStacking(typeFrom, from, levelFrom, typeTo, to, levelTo, state, rotation, value);
  } else if (levelFrom >= 0 && levelTo >= 0) {
    result = new ActionMoveLevelFromLevelTo(typeFrom, from, levelFrom, typeTo, to, levelTo, state, rotation, value);
  } else if (levelFrom >= 0) {
    result = new ActionMoveLevelFrom(typeFrom, from, levelFrom, typeTo, to, state, rotation, value);
  } else if (levelTo >= 0) {
    result = new ActionMoveLevelTo(typeFrom, from, typeTo, to, levelTo, state, rotation, value);
  } else {
    result = new ActionMoveTopPiece(typeFrom, from, typeTo, to, state, rotation, value);
  }
  if (decision !== undefined) result.setDecision(decision);
  return result;
}

/** Reconstruct from detailed string. */
export function constructActionMoveFromString(detailedString: string): BaseAction {
  const strTypeFrom = extractData(detailedString, "typeFrom");
  const typeFrom: SiteType | null = strTypeFrom === "" ? null : (strTypeFrom as SiteType);
  const strFrom = extractData(detailedString, "from");
  const from = parseInt(strFrom, 10);
  const strLevelFrom = extractData(detailedString, "levelFrom");
  const levelFrom = strLevelFrom === "" ? UNDEFINED : parseInt(strLevelFrom, 10);
  const strTypeTo = extractData(detailedString, "typeTo");
  const typeTo: SiteType | null = strTypeTo === "" ? null : (strTypeTo as SiteType);
  const strTo = extractData(detailedString, "to");
  const to = parseInt(strTo, 10);
  const strLevelTo = extractData(detailedString, "levelTo");
  const levelTo = strLevelTo === "" ? UNDEFINED : parseInt(strLevelTo, 10);
  const strState = extractData(detailedString, "state");
  const state = strState === "" ? UNDEFINED : parseInt(strState, 10);
  const strRotation = extractData(detailedString, "rotation");
  const rotation = strRotation === "" ? UNDEFINED : parseInt(strRotation, 10);
  const strValue = extractData(detailedString, "value");
  const value = strValue === "" ? UNDEFINED : parseInt(strValue, 10);
  const strStack = extractData(detailedString, "stack");
  const onStacking = strStack === "" ? false : strStack === "true";
  const strDecision = extractData(detailedString, "decision");
  const decision = strDecision === "" ? false : strDecision === "true";

  return constructActionMove(typeFrom, from, levelFrom, typeTo, to, levelTo, state, rotation, value, onStacking, decision);
}

// Unused direct LudiiContext apply — kept for API completeness
export type { LudiiContext };
