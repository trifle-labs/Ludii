// @java Core/src/game/functions/region/sites/SitesMoveType.java

/**
 * Specifies sets of sites based on the positions of moves.
 *
 * @java game/functions/region/sites/SitesMoveType.java
 * @author Dennis Soemers and Eric.Piette
 */
export enum SitesMoveType {
  /** From-positions of a collection of moves as a set of sites. */
  From = "From",

  /** Between-positions of a collection of moves as a set of sites. */
  Between = "Between",

  /** To-positions of a collection of moves as a set of sites. */
  To = "To",
}
