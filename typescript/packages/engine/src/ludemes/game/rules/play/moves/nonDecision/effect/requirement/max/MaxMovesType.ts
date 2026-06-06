// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/MaxMovesType.java

/**
 * Defines the types of properties which can be used for the Max super ludeme
 * with only a move ludeme in entry.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.requirement.max.MaxMovesType (Java enum).
 *
 * @author Eric.Piette (Java original)
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/MaxMovesType.java
 */
export const MAX_MOVES_TYPE_VALUES = [
  /**
   * To filter a list of legal moves to keep only the moves allowing the maximum
   * number of moves in a turn.
   */
  "Moves",

  /**
   * To filter a list of moves to keep only the moves doing the maximum possible
   * number of captures.
   */
  "Captures",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/requirement/max/MaxMovesType.java — enum MaxMovesType */
export type MaxMovesType = (typeof MAX_MOVES_TYPE_VALUES)[number];

/** True iff the given string is a valid MaxMovesType value. */
export function isMaxMovesType(value: string): value is MaxMovesType {
  return (MAX_MOVES_TYPE_VALUES as readonly string[]).includes(value);
}
