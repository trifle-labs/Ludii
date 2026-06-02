// @java Core/src/other/action/move/remove/ActionRemove.java ActionRemove
/**
 * Factory that dispatches to the correct ActionRemove* subclass.
 *
 * Faithful 1:1 transliteration of other.action.move.remove.ActionRemove.
 *
 * @author Eric.Piette  (Java original)
 */

import { BaseAction, extractData, UNDEFINED } from "../../Action.js";
import { SiteType } from "../../SiteType.js";
import { ActionRemoveLevel } from "./ActionRemoveLevel.js";
import { ActionRemoveNonApplied } from "./ActionRemoveNonApplied.js";
import { ActionRemoveTopPiece } from "./ActionRemoveTopPiece.js";

/** @java other.action.move.remove.ActionRemove#construct */
export function constructActionRemove(
  type: SiteType | null,
  to: number,
  level: number,
  applied: boolean,
  decision?: boolean,
): BaseAction {
  let result: BaseAction;
  if (!applied) {
    result = new ActionRemoveNonApplied(type, to);
  } else if (level !== UNDEFINED) {
    result = new ActionRemoveLevel(type, to, level);
  } else {
    result = new ActionRemoveTopPiece(type, to);
  }
  if (decision !== undefined) result.setDecision(decision);
  return result;
}

/** Reconstruct from detailed string. */
export function constructActionRemoveFromString(detailedString: string): BaseAction {
  const strType = extractData(detailedString, "type");
  const type: SiteType | null = strType === "" ? null : (strType as SiteType);
  const strTo = extractData(detailedString, "to");
  const to = parseInt(strTo, 10);
  const strLevel = extractData(detailedString, "level");
  const level = strLevel === "" ? UNDEFINED : parseInt(strLevel, 10);
  const strApplied = extractData(detailedString, "applied");
  const applied = strApplied === "" ? true : strApplied === "true";
  const strDecision = extractData(detailedString, "decision");
  const decision = strDecision === "" ? false : strDecision === "true";
  return constructActionRemove(type, to, level, applied, decision);
}
