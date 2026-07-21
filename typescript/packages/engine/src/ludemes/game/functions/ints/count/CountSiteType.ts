// @java Core/src/game/functions/ints/count/CountSiteType.java

/**
 * Defines the types of sites that can be counted within a game.
 *
 * @java game/functions/ints/count/CountSiteType.java
 * @author Eric.Piette and cambolbro
 */
export enum CountSiteType {
  /** Number of playable sites within a region or container. */
  Sites = "Sites",

  /** Number of adjacent (connected) elements. */
  Adjacent = "Adjacent",

  /** Number of neighbours (not necessarily connected). */
  Neighbours = "Neighbours",

  /** Number of orthogonal elements. */
  Orthogonal = "Orthogonal",

  /** Number of diagonal elements. */
  Diagonal = "Diagonal",

  /** Number of off-diagonal elements. */
  Off = "Off",

  /** Number of sites occupied by an item of a given player on the sites (platform) below another site. */
  SitesPlatformBelow = "SitesPlatformBelow",
}
