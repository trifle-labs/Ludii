// @java Core/src/game/rules/play/moves/decision/MoveStepType.java

/**
 * Defines the types of decision move corresponding to a step move.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.decision.MoveStepType (Java enum).
 *
 * @java game/rules/play/moves/decision/MoveStepType.java
 */
export const MOVE_STEP_TYPE_VALUES = [
  /** Makes a step move. */
  "Step",
] as const;

/** @java game/rules/play/moves/decision/MoveStepType.java — enum MoveStepType */
export type MoveStepType = (typeof MOVE_STEP_TYPE_VALUES)[number];

/** True iff the given string is a valid MoveStepType value. */
export function isMoveStepType(value: string): value is MoveStepType {
  return (MOVE_STEP_TYPE_VALUES as readonly string[]).includes(value);
}
