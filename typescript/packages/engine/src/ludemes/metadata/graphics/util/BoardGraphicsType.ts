/**
 * BoardGraphicsType.ts
 *
 * @java metadata/graphics/util/BoardGraphicsType.java
 *
 * Enum-like type for board graphics element categories, each carrying
 * a numeric value and an associated SiteType string.
 */

/** @java metadata.graphics.util.BoardGraphicsType */
export interface BoardGraphicsTypeEntry {
  readonly name: string;
  readonly value: number;
  /** null for Symbols. */
  readonly siteType: "Cell" | "Edge" | "Vertex" | null;
}

/** All BoardGraphicsType entries in declaration order. */
export const BOARD_GRAPHICS_TYPE_ENTRIES: readonly BoardGraphicsTypeEntry[] = [
  { name: "InnerEdges",    value: 0,  siteType: "Edge"   },
  { name: "OuterEdges",    value: 1,  siteType: "Edge"   },
  { name: "Phase0",        value: 2,  siteType: "Cell"   },
  { name: "Phase1",        value: 3,  siteType: "Cell"   },
  { name: "Phase2",        value: 4,  siteType: "Cell"   },
  { name: "Phase3",        value: 5,  siteType: "Cell"   },
  { name: "Phase4",        value: 6,  siteType: "Cell"   },
  { name: "Phase5",        value: 7,  siteType: "Cell"   },
  { name: "Symbols",       value: 8,  siteType: null     },
  { name: "InnerVertices", value: 9,  siteType: "Vertex" },
  { name: "OuterVertices", value: 10, siteType: "Vertex" },
] as const;

/** @java metadata.graphics.util.BoardGraphicsType */
export type BoardGraphicsType =
  | "InnerEdges"
  | "OuterEdges"
  | "Phase0"
  | "Phase1"
  | "Phase2"
  | "Phase3"
  | "Phase4"
  | "Phase5"
  | "Symbols"
  | "InnerVertices"
  | "OuterVertices";

/** True iff the given string is a valid BoardGraphicsType name. */
export function isBoardGraphicsType(value: string): value is BoardGraphicsType {
  return BOARD_GRAPHICS_TYPE_ENTRIES.some((e) => e.name === value);
}

/**
 * Returns the entry for a given numeric value.
 * @java BoardGraphicsType.getTypeFromValue(int)
 */
export function boardGraphicsTypeFromValue(value: number): BoardGraphicsTypeEntry | null {
  return BOARD_GRAPHICS_TYPE_ENTRIES.find((e) => e.value === value) ?? null;
}
