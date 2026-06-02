/**
 * PuzzleHintLocationType.ts
 *
 * @java metadata/graphics/util/PuzzleHintLocationType.java
 *
 * Defines different ways of placing puzzle hints.
 */

/** @java metadata.graphics.util.PuzzleHintLocationType */
export const PUZZLE_HINT_LOCATION_TYPES = [
  /** Hints placed on top-left site of region. */
  "Default",

  /** Draw hint on edge between vertices. */
  "BetweenVertices",
] as const;

/** @java metadata.graphics.util.PuzzleHintLocationType */
export type PuzzleHintLocationType = (typeof PUZZLE_HINT_LOCATION_TYPES)[number];

/** True iff the given string is a valid PuzzleHintLocationType value. */
export function isPuzzleHintLocationType(value: string): value is PuzzleHintLocationType {
  return (PUZZLE_HINT_LOCATION_TYPES as readonly string[]).includes(value);
}
