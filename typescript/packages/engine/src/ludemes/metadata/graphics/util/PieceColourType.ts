/**
 * PieceColourType.ts
 *
 * @java metadata/graphics/util/PieceColourType.java
 *
 * Defines different colours for a piece.
 */

/** @java metadata.graphics.util.PieceColourType */
export const PIECE_COLOUR_TYPES = [
  /** Fill colour. */
  "Fill",

  /** Edge colour. */
  "Edge",

  /** Secondary colour. Used for things like the count colour. */
  "Secondary",
] as const;

/** @java metadata.graphics.util.PieceColourType */
export type PieceColourType = (typeof PIECE_COLOUR_TYPES)[number];

/** True iff the given string is a valid PieceColourType value. */
export function isPieceColourType(value: string): value is PieceColourType {
  return (PIECE_COLOUR_TYPES as readonly string[]).includes(value);
}
