// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetTrumpType.java

/**
 * Defines the types of suit that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetTrumpType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetTrumpType.java
 */
export const SET_TRUMP_TYPE_VALUES = [
  /** Sets the trump suit. */
  "TrumpSuit",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetTrumpType.java — enum SetTrumpType */
export type SetTrumpType = (typeof SET_TRUMP_TYPE_VALUES)[number];

/** True iff the given string is a valid SetTrumpType value. */
export function isSetTrumpType(value: string): value is SetTrumpType {
  return (SET_TRUMP_TYPE_VALUES as readonly string[]).includes(value);
}
