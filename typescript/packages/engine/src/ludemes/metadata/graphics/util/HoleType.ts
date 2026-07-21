/**
 * HoleType.ts
 *
 * @java metadata/graphics/util/HoleType.java
 *
 * Defines hole styles for Mancala board.
 */

/** @java metadata.graphics.util.HoleType */
export const HOLE_TYPES = [
  /** Hole as Square. */
  "Square",

  /** Hole as Oval. */
  "Oval",
] as const;

/** @java metadata.graphics.util.HoleType */
export type HoleType = (typeof HOLE_TYPES)[number];

/** True iff the given string is a valid HoleType value. */
export function isHoleType(value: string): value is HoleType {
  return (HOLE_TYPES as readonly string[]).includes(value);
}
