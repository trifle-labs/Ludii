// @java Core/src/game/functions/booleans/is/IsSimpleType.java

/**
 * Defines the types of Is test for a player with no parameter.
 */
export enum IsSimpleType {
  /**
   * To check if the game is repeating the same set of states three times with
   * exactly the same moves during these states.
   */
  Cycle = 0,

  /** To check if the state is in pending. */
  Pending = 1,

  /** To check if the board is full. */
  Full = 2,
}
