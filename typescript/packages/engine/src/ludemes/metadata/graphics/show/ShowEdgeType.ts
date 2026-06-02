/**
 * ShowEdgeType.ts
 *
 * @java metadata/graphics/show/ShowEdgeType.java
 *
 * Defines the types of Draw metadata related to edges.
 */

/** @java metadata.graphics.show.ShowEdgeType */
export const SHOW_EDGE_TYPES = [
  /** Specifies customised drawing of edges in the board graph. */
  "Edges",
] as const;

/** @java metadata.graphics.show.ShowEdgeType */
export type ShowEdgeType = (typeof SHOW_EDGE_TYPES)[number];

/** True iff the given string is a valid ShowEdgeType value. */
export function isShowEdgeType(value: string): value is ShowEdgeType {
  return (SHOW_EDGE_TYPES as readonly string[]).includes(value);
}
