/**
 * Defines the types of Piece metadata to set a colour.
 *
 * @java metadata/graphics/piece/PieceColourType.java
 */
export const PIECE_COLOUR_TYPES = [
  /** To set the colour of a piece. */
  "Colour",
] as const;

/** @java metadata/graphics/piece/PieceColourType.java — enum PieceColourType */
export type PieceColourType = (typeof PIECE_COLOUR_TYPES)[number];

/** True iff the given string is a valid PieceColourType value. */
export function isPieceColourType(value: string): value is PieceColourType {
  return (PIECE_COLOUR_TYPES as readonly string[]).includes(value);
}
