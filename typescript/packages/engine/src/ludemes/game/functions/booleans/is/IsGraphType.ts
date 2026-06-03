// @java Core/src/game/functions/booleans/is/IsGraphType.java

/**
 * Defines the types of Is test according to a graph element.
 *
 * @author Eric.Piette
 */
export enum IsGraphType {
  /** Check the graph element type of the "from" location of the last move. */
  LastFrom = 0,

  /** Check the graph element type of the "to" location of the last move. */
  LastTo = 1,
}
