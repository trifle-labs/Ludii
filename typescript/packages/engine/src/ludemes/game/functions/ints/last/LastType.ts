// @java Core/src/game/functions/ints/last/LastType.java

/**
 * Defines the types of Last integer ludeme.
 *
 * @java game/functions/ints/last/LastType.java
 * @author Eric.Piette
 */

export const LAST_TYPES = [
  /** To return the "from" site of the last move. */
  "From",
  /** To return the "level from" of the last move. */
  "LevelFrom",
  /** To return the "to" site of the last move. */
  "To",
  /** To return the "level to" site of the last move. */
  "LevelTo",
] as const;

/** @java game/functions/ints/last/LastType.java — enum LastType */
export type LastType = (typeof LAST_TYPES)[number];

/** True iff the given string is a valid LastType value. */
export function isLastType(value: string): value is LastType {
  return (LAST_TYPES as readonly string[]).includes(value);
}
