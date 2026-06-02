/**
 * Defines the types of Piece metadata to rotate.
 *
 * @java metadata/graphics/piece/PieceRotateType.java
 */
export const PIECE_ROTATE_TYPES = [
  /** To indicate whether to rotate the image for a piece. */
  "Rotate",
] as const;

/** @java metadata/graphics/piece/PieceRotateType.java — enum PieceRotateType */
export type PieceRotateType = (typeof PIECE_ROTATE_TYPES)[number];

/** True iff the given string is a valid PieceRotateType value. */
export function isPieceRotateType(value: string): value is PieceRotateType {
  return (PIECE_ROTATE_TYPES as readonly string[]).includes(value);
}
