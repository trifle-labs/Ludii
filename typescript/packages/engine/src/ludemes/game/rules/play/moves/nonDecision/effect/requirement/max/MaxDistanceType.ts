// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/MaxDistanceType.java

/**
 * Defines the types of properties which can be used for the Max super ludeme
 * according to a distance.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.requirement.max.MaxDistanceType (Java enum).
 *
 * @author Eric.Piette (Java original)
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/MaxDistanceType.java
 */
export const MAX_DISTANCE_TYPE_VALUES = [
  /**
   * To filter the moves to keep only the moves allowing the maximum distance on a
   * track in a turn.
   */
  "Distance",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/requirement/max/MaxDistanceType.java — enum MaxDistanceType */
export type MaxDistanceType = (typeof MAX_DISTANCE_TYPE_VALUES)[number];

/** True iff the given string is a valid MaxDistanceType value. */
export function isMaxDistanceType(value: string): value is MaxDistanceType {
  return (MAX_DISTANCE_TYPE_VALUES as readonly string[]).includes(value);
}
