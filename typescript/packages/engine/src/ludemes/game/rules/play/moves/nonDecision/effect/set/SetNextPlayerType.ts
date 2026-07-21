// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetNextPlayerType.java

/**
 * Defines the types of player that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetNextPlayerType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetNextPlayerType.java
 */
export const SET_NEXT_PLAYER_TYPE_VALUES = [
  /** Sets the next player. */
  "NextPlayer",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetNextPlayerType.java — enum SetNextPlayerType */
export type SetNextPlayerType = (typeof SET_NEXT_PLAYER_TYPE_VALUES)[number];

/** True iff the given string is a valid SetNextPlayerType value. */
export function isSetNextPlayerType(value: string): value is SetNextPlayerType {
  return (SET_NEXT_PLAYER_TYPE_VALUES as readonly string[]).includes(value);
}
