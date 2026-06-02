/**
 * Defines the types of Piece metadata to set the foreground/background.
 *
 * @java metadata/graphics/piece/PieceGroundType.java
 */
export const PIECE_GROUND_TYPES = [
  /** To draw a specified image in front of a piece. */
  "Background",
  /** To draw a specified image behind a piece. */
  "Foreground",
  /** To draw a specified image as the hidden symbol. */
  "Hidden",
] as const;

/** @java metadata/graphics/piece/PieceGroundType.java — enum PieceGroundType */
export type PieceGroundType = (typeof PIECE_GROUND_TYPES)[number];

/** True iff the given string is a valid PieceGroundType value. */
export function isPieceGroundType(value: string): value is PieceGroundType {
  return (PIECE_GROUND_TYPES as readonly string[]).includes(value);
}
