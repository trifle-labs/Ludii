// @java Core/src/game/functions/booleans/is/IsConnectType.java

/**
 * Defines the types of Is for a connected or blocked test.
 *
 * @author Eric.Piette
 */
export enum IsConnectType {
  /** To check if regions are connected by pieces owned by a player. */
  Connected = 0,

  /** To check if a player can not connect regions with his pieces. */
  Blocked = 1,
}
