/**
 * Defines certain landmarks that can be used to specify individual sites on the board.
 *
 * @java game/types/board/LandmarkType.java
 */
export const LANDMARK_TYPES = [
  /** The central site of the board. */
  "CentreSite",
  /** The site that is furthest to the left. */
  "LeftSite",
  /** The site that is furthest to the right. */
  "RightSite",
  /** The site that is furthest to the top. */
  "Topsite",
  /** The site that is furthest to the bottom. */
  "BottomSite",
  /** The first site indexed in the graph. */
  "FirstSite",
  /** The last site indexed in the graph. */
  "LastSite",
] as const;

/** @java game/types/board/LandmarkType.java — enum LandmarkType */
export type LandmarkType = (typeof LANDMARK_TYPES)[number];

/** True iff the given string is a valid LandmarkType value. */
export function isLandmarkType(value: string): value is LandmarkType {
  return (LANDMARK_TYPES as readonly string[]).includes(value);
}
