// @java Core/src/game/functions/intArray/players/PlayersManyType.java

/**
 * Defines the types of set of players which can be iterated.
 *
 * @java game/functions/intArray/players/PlayersManyType.java
 *
 * Java parity: enum PlayersManyType { All, NonMover, Enemy, Friend, Ally }
 */

/**
 * Enum of multi-player-set types for players() ludeme.
 * @java game.functions.intArray.players.PlayersManyType
 */
export enum PlayersManyType {
  /** All players. */
  All      = "All",
  /** Players who are not moving. */
  NonMover = "NonMover",
  /** Enemy players. */
  Enemy    = "Enemy",
  /** Friend players (Mover + Allies). */
  Friend   = "Friend",
  /** Ally players. */
  Ally     = "Ally",
}
