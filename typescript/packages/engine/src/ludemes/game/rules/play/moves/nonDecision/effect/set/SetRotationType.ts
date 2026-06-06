// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetRotationType.java

/**
 * Defines the types of rotation that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetRotationType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetRotationType.java
 */
export const SET_ROTATION_TYPE_VALUES = [
  /** Sets the rotation of a piece. */
  "Rotation",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetRotationType.java — enum SetRotationType */
export type SetRotationType = (typeof SET_ROTATION_TYPE_VALUES)[number];

/** True iff the given string is a valid SetRotationType value. */
export function isSetRotationType(value: string): value is SetRotationType {
  return (SET_ROTATION_TYPE_VALUES as readonly string[]).includes(value);
}
