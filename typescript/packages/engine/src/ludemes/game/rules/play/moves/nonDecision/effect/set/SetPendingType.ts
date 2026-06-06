// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetPendingType.java

/**
 * Defines the types of 'pending' value that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetPendingType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetPendingType.java
 */
export const SET_PENDING_TYPE_VALUES = [
  /** Sets specified sites to a certain pending value. */
  "Pending",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetPendingType.java — enum SetPendingType */
export type SetPendingType = (typeof SET_PENDING_TYPE_VALUES)[number];

/** True iff the given string is a valid SetPendingType value. */
export function isSetPendingType(value: string): value is SetPendingType {
  return (SET_PENDING_TYPE_VALUES as readonly string[]).includes(value);
}
