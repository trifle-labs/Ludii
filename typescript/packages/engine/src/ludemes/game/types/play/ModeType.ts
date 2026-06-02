/**
 * Defines the possible modes of play.
 *
 * @java game/types/play/ModeType.java
 */
export const MODE_TYPES = [
  /** Players alternate making discrete moves. */
  "Alternating",
  /** Players move at the same time. */
  "Simultaneous",
  /** Simulation game. */
  "Simulation",
] as const;

/** @java game/types/play/ModeType.java — enum ModeType */
export type ModeType = (typeof MODE_TYPES)[number];

/** True iff the given string is a valid ModeType value. */
export function isModeType(value: string): value is ModeType {
  return (MODE_TYPES as readonly string[]).includes(value);
}
