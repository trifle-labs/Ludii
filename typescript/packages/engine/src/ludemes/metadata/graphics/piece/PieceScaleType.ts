/**
 * Defines the types of Piece metadata to scale.
 *
 * @java metadata/graphics/piece/PieceScaleType.java
 */
export const PIECE_SCALE_TYPES = [
  /** To set the image scale of a piece. */
  "Scale",
] as const;

/** @java metadata/graphics/piece/PieceScaleType.java — enum PieceScaleType */
export type PieceScaleType = (typeof PIECE_SCALE_TYPES)[number];

/** True iff the given string is a valid PieceScaleType value. */
export function isPieceScaleType(value: string): value is PieceScaleType {
  return (PIECE_SCALE_TYPES as readonly string[]).includes(value);
}
