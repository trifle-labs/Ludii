// @java Core/src/game/rules/play/moves/decision/MoveSwapType.java

/**
 * Defines the types of decision move corresponding to a swap move.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.decision.MoveSwapType (Java enum).
 *
 * @java game/rules/play/moves/decision/MoveSwapType.java
 */
export const MOVE_SWAP_TYPE_VALUES = [
  /** To Swap two pieces or two players. */
  "Swap",
] as const;

/** @java game/rules/play/moves/decision/MoveSwapType.java — enum MoveSwapType */
export type MoveSwapType = (typeof MOVE_SWAP_TYPE_VALUES)[number];

/** True iff the given string is a valid MoveSwapType value. */
export function isMoveSwapType(value: string): value is MoveSwapType {
  return (MOVE_SWAP_TYPE_VALUES as readonly string[]).includes(value);
}
