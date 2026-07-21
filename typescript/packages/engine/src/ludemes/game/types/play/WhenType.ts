/**
 * Defines when to perform certain tests or actions within a game.
 *
 * @java game/types/play/WhenType.java
 */
export const WHEN_TYPES = [
  /** Start of a turn. */
  "StartOfTurn",
  /** End of a turn. */
  "EndOfTurn",
] as const;

/** @java game/types/play/WhenType.java — enum WhenType */
export type WhenType = (typeof WHEN_TYPES)[number];

/** True iff the given string is a valid WhenType value. */
export function isWhenType(value: string): value is WhenType {
  return (WHEN_TYPES as readonly string[]).includes(value);
}
