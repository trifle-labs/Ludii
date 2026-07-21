// @java Core/src/game/functions/ints/count/CountStepsType.java

/**
 * Defines the types of steps properties that can be counted within a game.
 *
 * @java game/functions/ints/count/CountStepsType.java
 * @author Eric.Piette
 */

export const COUNT_STEPS_TYPES = [
  /** Number of steps between two sites. */
  "Steps",
] as const;

/** @java game/functions/ints/count/CountStepsType.java — enum CountStepsType */
export type CountStepsType = (typeof COUNT_STEPS_TYPES)[number];

/** True iff the given string is a valid CountStepsType value. */
export function isCountStepsType(value: string): value is CountStepsType {
  return (COUNT_STEPS_TYPES as readonly string[]).includes(value);
}
