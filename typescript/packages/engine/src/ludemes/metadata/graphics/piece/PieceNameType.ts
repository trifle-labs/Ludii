/**
 * Defines the types of Piece metadata to change the name.
 *
 * @java metadata/graphics/piece/PieceNameType.java
 */
export const PIECE_NAME_TYPES = [
  /** To replace a piece's name with an alternative. */
  "Rename",
  /** To add additional text to a piece name. */
  "ExtendName",
  /** To add the local state value of a piece to its name. */
  "AddStateToName",
  /** To set the hidden image for a piece. */
  "Hidden",
] as const;

/** @java metadata/graphics/piece/PieceNameType.java — enum PieceNameType */
export type PieceNameType = (typeof PIECE_NAME_TYPES)[number];

/** True iff the given string is a valid PieceNameType value. */
export function isPieceNameType(value: string): value is PieceNameType {
  return (PIECE_NAME_TYPES as readonly string[]).includes(value);
}
