/**
 * Defines the types of Piece metadata to reflect.
 *
 * @java metadata/graphics/piece/PieceReflectType.java
 */
export const PIECE_REFLECT_TYPES = [
  /** To indicate whether to apply any vertical or horizontal image reflections to a piece. */
  "Reflect",
] as const;

/** @java metadata/graphics/piece/PieceReflectType.java — enum PieceReflectType */
export type PieceReflectType = (typeof PIECE_REFLECT_TYPES)[number];

/** True iff the given string is a valid PieceReflectType value. */
export function isPieceReflectType(value: string): value is PieceReflectType {
  return (PIECE_REFLECT_TYPES as readonly string[]).includes(value);
}
