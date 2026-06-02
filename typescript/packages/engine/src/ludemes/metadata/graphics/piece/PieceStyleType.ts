/**
 * Defines the types of Piece metadata to set a style.
 *
 * @java metadata/graphics/piece/PieceStyleType.java
 */
export const PIECE_STYLE_TYPES = [
  /** To set the style of a piece. */
  "Style",
] as const;

/** @java metadata/graphics/piece/PieceStyleType.java — enum PieceStyleType */
export type PieceStyleType = (typeof PIECE_STYLE_TYPES)[number];

/** True iff the given string is a valid PieceStyleType value. */
export function isPieceStyleType(value: string): value is PieceStyleType {
  return (PIECE_STYLE_TYPES as readonly string[]).includes(value);
}
