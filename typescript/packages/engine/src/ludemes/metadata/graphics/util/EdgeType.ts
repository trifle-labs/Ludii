/**
 * EdgeType.ts
 *
 * @java metadata/graphics/util/EdgeType.java
 *
 * Defines edge type for drawing board elements, e.g. for graph games.
 */

/** @java metadata.graphics.util.EdgeType */
export const EDGE_TYPES = [
  /** All board edges. */
  "All",

  /** Inner board edges. */
  "Inner",

  /** Outer board edges. */
  "Outer",

  /** Interlayer board edges. */
  "Interlayer",
] as const;

/** @java metadata.graphics.util.EdgeType */
export type EdgeType = (typeof EDGE_TYPES)[number];

/** True iff the given string is a valid EdgeType value. */
export function isEdgeType(value: string): value is EdgeType {
  return (EDGE_TYPES as readonly string[]).includes(value);
}

/**
 * Returns true if this EdgeType is equal to or a superset of eA.
 * @java EdgeType.supersetOf(EdgeType)
 */
export function edgeTypeSupersetOf(self: EdgeType, eA: EdgeType): boolean {
  if (self === eA) return true;
  if (self === "All") return true;
  return false;
}
