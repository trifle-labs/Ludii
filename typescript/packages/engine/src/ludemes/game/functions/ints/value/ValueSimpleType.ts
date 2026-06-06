// @java Core/src/game/functions/ints/value/ValueSimpleType.java

/**
 * Defines the types of properties than can be returned by the super ludeme
 * value with no parameter.
 *
 * @java game/functions/ints/value/ValueSimpleType.java
 * @author Eric.Piette
 */
export enum ValueSimpleType {
  /**
   * To get the pending value if the previous state causes the current state to be
   * pending with a specific value.
   */
  Pending = "Pending",

  /**
   * To get the move limit of a game.
   */
  MoveLimit = "MoveLimit",

  /**
   * To get the turn limit of a game.
   */
  TurnLimit = "TurnLimit",
}
