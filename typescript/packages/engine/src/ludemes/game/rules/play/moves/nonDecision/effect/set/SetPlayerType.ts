// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetPlayerType.java

/**
 * Defines properties related to the players that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetPlayerType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetPlayerType.java
 */
export const SET_PLAYER_TYPE_VALUES = [
  /** Sets the value associated with a player. */
  "Value",

  /** Sets the score of a player. */
  "Score",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetPlayerType.java — enum SetPlayerType */
export type SetPlayerType = (typeof SET_PLAYER_TYPE_VALUES)[number];

/** True iff the given string is a valid SetPlayerType value. */
export function isSetPlayerType(value: string): value is SetPlayerType {
  return (SET_PLAYER_TYPE_VALUES as readonly string[]).includes(value);
}
