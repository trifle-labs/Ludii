// @java Core/src/game/functions/booleans/is/IsIntegerType.java

/**
 * Defines the types of Is test according to an integer.
 *
 * @author Eric.Piette
 */
export enum IsIntegerType {
  /** To check if a value is odd. */
  Odd = 0,

  /** To check if a value is even. */
  Even = 1,

  /** To check if a site was already visited by a piece in the same turn. */
  Visited = 2,

  /** To detect whether the terminus of a tile matches with its neighbors. */
  SidesMatch = 3,

  /** To detect whether the pips of a domino match its neighbours. */
  PipsMatch = 4,

  /**
   * To Ensures that in a 3D board, all the pieces in the bottom layer must be
   * placed so that they do not fall.
   */
  Flat = 5,

  /**
   * To check if any current die is equal to a specific value.
   */
  AnyDie = 6,
}
