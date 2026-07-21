// @java Core/src/game/util/directions/Direction.java
//
// Marker interface for direction values (both absolute and relative).
// In Java this adds a directionsFunctions() method; in the TS port
// we expose the direction kind as a discriminant.

/**
 * The different directions which can be used by some moves.
 * Implemented by AbsoluteDirection enum values and RelativeDirection enum values.
 *
 * @java game.util.directions.Direction
 */
export type Direction =
  | { readonly kind: "absolute"; readonly value: number }
  | { readonly kind: "relative"; readonly value: number };
