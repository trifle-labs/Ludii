// @java Core/src/game/functions/region/sites/SitesSimpleType.java

/**
 * Specifies set of sites that do not require any parameters (apart from the graph element type).
 *
 * @java game/functions/region/sites/SitesSimpleType.java
 * @author Eric.Piette and cambolbro
 */
export enum SitesSimpleType {
  /** All board sites. */
  Board = "Board",

  /** Sites on the top side of the board. */
  Top = "Top",

  /** Sites on the bottom side of the board. */
  Bottom = "Bottom",

  /** Sites on the left side of the board. */
  Left = "Left",

  /** Sites on the right side of the board. */
  Right = "Right",

  /** Interior board sites. */
  Inner = "Inner",

  /** Outer board sites. */
  Outer = "Outer",

  /** Perimeter board sites. */
  Perimeter = "Perimeter",

  /** Corner board sites. */
  Corners = "Corners",

  /** Concave corner board sites. */
  ConcaveCorners = "ConcaveCorners",

  /** Convex corner board sites. */
  ConvexCorners = "ConvexCorners",

  /** Major generator board sites. */
  Major = "Major",

  /** Minor generator board sites. */
  Minor = "Minor",

  /** Centre board site(s). */
  Centre = "Centre",

  /** Sites that contain a puzzle hint. */
  Hint = "Hint",

  /** Sites to remove at the end of a capture sequence. */
  ToClear = "ToClear",

  /**
   * Sites in the line of play. Applies to domino game
   * (returns an empty region for other games).
   */
  LineOfPlay = "LineOfPlay",

  /** Sites with a non-zero ``pending'' value in the game state. */
  Pending = "Pending",

  /**
   * Playable sites of a boardless game. For other games, returns the set of
   * empty sites adjacent to occupied sites.
   */
  Playable = "Playable",

  /**
   * The set of ``to'' sites of the last move.
   */
  LastTo = "LastTo",

  /**
   * The set of ``from'' sites of the last move.
   */
  LastFrom = "LastFrom",
}
