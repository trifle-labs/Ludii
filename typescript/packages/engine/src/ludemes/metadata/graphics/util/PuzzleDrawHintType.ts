/**
 * PuzzleDrawHintType.ts
 *
 * @java metadata/graphics/util/PuzzleDrawHintType.java
 *
 * Defines different ways of visualising puzzle hints.
 */

/** @java metadata.graphics.util.PuzzleDrawHintType */
export const PUZZLE_DRAW_HINT_TYPES = [
  /** Hints drawn in the middle. */
  "Default",

  /** Hints drawn in the top left. */
  "TopLeft",

  /** Draw the hint next to the region. */
  "NextTo",

  /** No hints. */
  "None",
] as const;

/** @java metadata.graphics.util.PuzzleDrawHintType */
export type PuzzleDrawHintType = (typeof PUZZLE_DRAW_HINT_TYPES)[number];

/** True iff the given string is a valid PuzzleDrawHintType value. */
export function isPuzzleDrawHintType(value: string): value is PuzzleDrawHintType {
  return (PUZZLE_DRAW_HINT_TYPES as readonly string[]).includes(value);
}
