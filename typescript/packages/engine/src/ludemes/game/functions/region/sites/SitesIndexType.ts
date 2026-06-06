// @java Core/src/game/functions/region/sites/SitesIndexType.java

/**
 * Specifies sets of board sites by some indexed property.
 *
 * @java game/functions/region/sites/SitesIndexType.java
 * @author Eric.Piette and cambolbro
 */
export enum SitesIndexType {
  /** Sites in a specified row. */
  Row = "Row",

  /** Sites in a specified column. */
  Column = "Column",

  /** Sites in a specified phase. */
  Phase = "Phase",

  /** Vertices that make up a cell. */
  Cell = "Cell",

  /** End points of an edge. */
  Edge = "Edge",

  /** Sites with a specified state value. */
  State = "State",

  /** Empty (i.e. unoccupied) sites of a container. */
  Empty = "Empty",

  /** Sites in a specified layer. */
  Layer = "Layer",

  /** Sites which are supporting other pieces on sites top of them. */
  Support = "Support",
}
