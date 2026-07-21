/**
 * Defines the types of Piece metadata to scale by a data.
 *
 * @java metadata/graphics/piece/PieceScaleByType.java
 */
export const PIECE_SCALE_BY_TYPES = [
  /**
   * To indicate if the pieces in the game should be scaled in size based on their value.
   */
  "ByValue",
] as const;

/** @java metadata/graphics/piece/PieceScaleByType.java — enum PieceScaleByType */
export type PieceScaleByType = (typeof PIECE_SCALE_BY_TYPES)[number];

/** True iff the given string is a valid PieceScaleByType value. */
export function isPieceScaleByType(value: string): value is PieceScaleByType {
  return (PIECE_SCALE_BY_TYPES as readonly string[]).includes(value);
}
