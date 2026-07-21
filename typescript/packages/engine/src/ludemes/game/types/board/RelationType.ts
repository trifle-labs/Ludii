/**
 * Defines the possible relation types between graph elements.
 *
 * @java game/types/board/RelationType.java
 */
export const RELATION_TYPES = [
  /** Orthogonal relation. */
  "Orthogonal",
  /** Diagonal relation. */
  "Diagonal",
  /** Diagonal-off relation. */
  "OffDiagonal",
  /** Adjacent relation. */
  "Adjacent",
  /** Any relation. */
  "All",
] as const;

/** @java game/types/board/RelationType.java — enum RelationType */
export type RelationType = (typeof RELATION_TYPES)[number];

/** True iff the given string is a valid RelationType value. */
export function isRelationType(value: string): value is RelationType {
  return (RELATION_TYPES as readonly string[]).includes(value);
}

/**
 * @java game/types/board/RelationType.java — convert(RelationType)
 * Returns the equivalent AbsoluteDirection name string for this relation.
 * Mirrors Java RelationType.convert().
 */
export function relationToAbsoluteDirection(relation: RelationType): string {
  switch (relation) {
    case "Adjacent":    return "Adjacent";
    case "Diagonal":    return "Diagonal";
    case "All":         return "All";
    case "OffDiagonal": return "OffDiagonal";
    case "Orthogonal":  return "Orthogonal";
  }
}

/**
 * @java game/types/board/RelationType.java — supersetOf(RelationType)
 * Returns true if this relation is equal to or a superset of rA.
 */
export function relationSupersetOf(
  self: RelationType,
  rA: RelationType,
): boolean {
  if (self === rA) return true;
  if (self === "All") return true;
  if (self === "Adjacent" && rA === "Orthogonal") return true;
  return false;
}
