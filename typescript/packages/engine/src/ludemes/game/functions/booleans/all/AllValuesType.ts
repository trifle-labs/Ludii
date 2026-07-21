// @java Core/src/game/functions/booleans/all/AllValuesType.java

/**
 * Defines the query types that can be used for an (all ...) test related
 * to integer arrays.
 *
 * @java game/functions/booleans/all/AllValuesType.java
 * @author Eric.Piette
 */
export enum AllValuesType {
  /** Returns whether all the values satisfy a condition. */
  Values = "Values",
}

// Backward-compat string-union constants used by existing dispatchers.
export const ALL_VALUES_TYPES = ["Values"] as const;
export type AllValuesTypeStr = (typeof ALL_VALUES_TYPES)[number];
