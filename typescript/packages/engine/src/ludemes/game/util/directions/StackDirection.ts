// @java Core/src/game/util/directions/StackDirection.java
//
// Describes whether to access a stack from its bottom or its top.

/**
 * Describes the bottom or the top of a stack as origin for functions.
 *
 * @java game.util.directions.StackDirection
 */
export enum StackDirection {
  /** Check/access the stack from the bottom. */
  FromBottom = 0,

  /** Check/access the stack from the top. */
  FromTop = 1,
}
