/**
 * Defines the possible types of variables that can be used in deduction puzzles.
 *
 * @java game/types/board/PuzzleElementType.java
 */
export const PUZZLE_ELEMENT_TYPES = [
  /** A variable corresponding to a cell. */
  "Cell",
  /** A variable corresponding to an edge. */
  "Edge",
  /** A variable corresponding to a vertex. */
  "Vertex",
  /** A variable corresponding to a hint. */
  "Hint",
] as const;

/** @java game/types/board/PuzzleElementType.java — enum PuzzleElementType */
export type PuzzleElementType = (typeof PUZZLE_ELEMENT_TYPES)[number];

/** True iff the given string is a valid PuzzleElementType value. */
export function isPuzzleElementType(value: string): value is PuzzleElementType {
  return (PUZZLE_ELEMENT_TYPES as readonly string[]).includes(value);
}

/**
 * @java game/types/board/PuzzleElementType.java — convert(PuzzleElementType)
 * Converts a PuzzleElementType to its corresponding SiteType string, or null for Hint.
 */
export function puzzleElementToSiteType(
  puzzleElement: PuzzleElementType,
): "Cell" | "Edge" | "Vertex" | null {
  switch (puzzleElement) {
    case "Cell":   return "Cell";
    case "Edge":   return "Edge";
    case "Vertex": return "Vertex";
    default:       return null;
  }
}
