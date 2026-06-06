// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetHiddenType.java

/**
 * Defines the types of hidden information that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetHiddenType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetHiddenType.java
 */
export const SET_HIDDEN_TYPE_VALUES = [
  /** Sets the hidden information of a location. */
  "Hidden",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetHiddenType.java — enum SetHiddenType */
export type SetHiddenType = (typeof SET_HIDDEN_TYPE_VALUES)[number];

/** True iff the given string is a valid SetHiddenType value. */
export function isSetHiddenType(value: string): value is SetHiddenType {
  return (SET_HIDDEN_TYPE_VALUES as readonly string[]).includes(value);
}
