// @java Core/src/game/functions/booleans/all/AllSimpleType.java

/**
 * Defines the query types that can be used for an (all ...) test with no parameter.
 *
 * @java game/functions/booleans/all/AllSimpleType.java
 * @author Eric.Piette
 */
export enum AllSimpleType {
  /** Returns whether all the dice have been used in the current turn. */
  DiceUsed = "DiceUsed",

  /** Returns whether all the dice are equal when they are rolled. */
  DiceEqual = "DiceEqual",

  /** Returns whether all players have passed in succession. */
  Passed = "Passed",
}

// Backward-compat string-union constants used by existing dispatchers.
export const ALL_SIMPLE_TYPES = ["DiceUsed", "DiceEqual", "Passed"] as const;
export type AllSimpleTypeStr = (typeof ALL_SIMPLE_TYPES)[number];
