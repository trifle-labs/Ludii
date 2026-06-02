/**
 * Defines known (predefined) regions of the board.
 *
 * @java game/types/board/RegionTypeStatic.java
 */
export const REGION_TYPE_STATIC_VALUES = [
  /** Row areas. */
  "Rows",
  /** Column areas. */
  "Columns",
  /** All direction areas. */
  "AllDirections",
  /** Hint areas. */
  "HintRegions",
  /** Layers areas. */
  "Layers",
  /** Diagonal areas. */
  "Diagonals",
  /** SubGrid areas. */
  "SubGrids",
  /** Region areas. */
  "Regions",
  /** Vertex areas. */
  "Vertices",
  /** Corner areas. */
  "Corners",
  /** Side areas. */
  "Sides",
  /** Side areas that are not corners. */
  "SidesNoCorners",
  /** All site areas. */
  "AllSites",
  /** Touching areas. */
  "Touching",
] as const;

/** @java game/types/board/RegionTypeStatic.java — enum RegionTypeStatic */
export type RegionTypeStatic = (typeof REGION_TYPE_STATIC_VALUES)[number];

/** True iff the given string is a valid RegionTypeStatic value. */
export function isRegionTypeStatic(value: string): value is RegionTypeStatic {
  return (REGION_TYPE_STATIC_VALUES as readonly string[]).includes(value);
}
