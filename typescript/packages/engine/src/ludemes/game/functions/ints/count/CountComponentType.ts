// @java Core/src/game/functions/ints/count/CountComponentType.java

/**
 * Defines the types of components that can be counted within a game.
 *
 * @java game/functions/ints/count/CountComponentType.java
 * @author Eric.Piette and cambolbro
 */
export enum CountComponentType {
  /** Number of pieces on the board (or in hand), per player or over all players. */
  Pieces = "Pieces",

  /** The number of pips showing on all dice, or dice owned by a specified player. */
  Pips = "Pips",
}
