/**
 * Defines the types of Piece metadata belonging to some families.
 *
 * @java metadata/graphics/piece/PieceFamiliesType.java
 */
export const PIECE_FAMILIES_TYPES = [
  /** To specify a list of families for the game's pieces. */
  "Families",
] as const;

/** @java metadata/graphics/piece/PieceFamiliesType.java — enum PieceFamiliesType */
export type PieceFamiliesType = (typeof PIECE_FAMILIES_TYPES)[number];

/** True iff the given string is a valid PieceFamiliesType value. */
export function isPieceFamiliesType(value: string): value is PieceFamiliesType {
  return (PIECE_FAMILIES_TYPES as readonly string[]).includes(value);
}
