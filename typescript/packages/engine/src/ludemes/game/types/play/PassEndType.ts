/**
 * Defines the possible types of ending results if all players are passed their turn.
 *
 * @java game/types/play/PassEndType.java
 */
export const PASS_END_TYPES = [
  /** The game is a draw. */
  "Draw",
  /** The game does not end. */
  "NoEnd",
] as const;

/** @java game/types/play/PassEndType.java — enum PassEndType */
export type PassEndType = (typeof PASS_END_TYPES)[number];

/** True iff the given string is a valid PassEndType value. */
export function isPassEndType(value: string): value is PassEndType {
  return (PASS_END_TYPES as readonly string[]).includes(value);
}
