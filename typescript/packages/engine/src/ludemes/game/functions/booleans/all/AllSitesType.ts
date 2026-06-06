// @java Core/src/game/functions/booleans/all/AllSitesType.java

/**
 * Defines the query types that can be used for an (all ...) test related to sites.
 *
 * @java game/functions/booleans/all/AllSitesType.java
 * @author Eric.Piette
 */
export enum AllSitesType {
  /** Returns whether all the sites satisfy a condition. */
  Sites = "Sites",

  /** Returns whether all the sites are different. */
  Different = "Different",
}

// Backward-compat string-union constants used by existing dispatchers.
export const ALL_SITES_TYPES = ["Sites", "Different"] as const;
export type AllSitesTypeStr = (typeof ALL_SITES_TYPES)[number];
