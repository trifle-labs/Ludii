// @java Core/src/game/functions/booleans/is/IsPlayerType.java

/**
 * Defines the types of Is test for a player.
 * @java game.functions.booleans.is.IsPlayerType
 */
export enum IsPlayerType {
  /** To check if a player is the mover. */
  Mover = "Mover",

  /** To check if a player is the next mover. */
  Next = "Next",

  /** To check if a player is the previous mover. */
  Prev = "Prev",

  /** To check if a player is the friend of the mover. */
  Friend = "Friend",

  /** To check if a player is the enemy of the mover. */
  Enemy = "Enemy",

  /** To check if a player is active. */
  Active = "Active",
}
