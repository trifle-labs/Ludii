// @java Core/src/game/functions/booleans/all/AllGroupsType.java

/**
 * Defines the query types that can be used for an (all ...) test for the groups.
 *
 * @java game/functions/booleans/all/AllGroupsType.java
 * @author Eric.Piette
 */
export enum AllGroupsType {
  /** Returns whether all the groups verify a condition. */
  Groups = "Groups",
}

// Backward-compat string-union constants used by existing dispatchers.
export const ALL_GROUPS_TYPES = ["Groups"] as const;
export type AllGroupsTypeStr = (typeof ALL_GROUPS_TYPES)[number];
