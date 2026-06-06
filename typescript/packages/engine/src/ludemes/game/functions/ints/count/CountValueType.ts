// @java Core/src/game/functions/ints/count/CountValueType.java

/**
 * Defines the types of value properties that can be counted within a game.
 *
 * @java game/functions/ints/count/CountValueType.java
 * @author Eric.Piette
 */

export const COUNT_VALUE_TYPES = [
  /** Number of specific value in an array. */
  "Value",
] as const;

/** @java game/functions/ints/count/CountValueType.java — enum CountValueType */
export type CountValueType = (typeof COUNT_VALUE_TYPES)[number];

/** True iff the given string is a valid CountValueType value. */
export function isCountValueType(value: string): value is CountValueType {
  return (COUNT_VALUE_TYPES as readonly string[]).includes(value);
}
