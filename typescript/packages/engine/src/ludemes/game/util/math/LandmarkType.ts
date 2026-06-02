// @java Core/src/game/types/board/LandmarkType.java
//
// Defines certain landmarks used to specify individual sites on the board.

/**
 * @java game.types.board.LandmarkType
 */
export enum LandmarkType {
  /** The central site of the board. */
  CentreSite = 0,

  /** The site furthest to the left. */
  LeftSite = 1,

  /** The site furthest to the right. */
  RightSite = 2,

  /** The site furthest to the top. */
  Topsite = 3,

  /** The site furthest to the bottom. */
  BottomSite = 4,

  /** The first site indexed in the graph. */
  FirstSite = 5,

  /** The last site indexed in the graph. */
  LastSite = 6,
}
