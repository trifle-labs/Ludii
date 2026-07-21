/**
 * MetadataFunctions.ts
 *
 * @java metadata/graphics/util/MetadataFunctions.java
 *
 * Metadata utility functions.
 *
 * NOTE: The Java implementations depend on the full runtime context
 * (Context, Regions, Id). These are GUI rendering-hint utilities; the
 * TypeScript port preserves the signatures but leaves the bodies as stubs
 * since the engine does not evaluate GUI functions.
 */

/**
 * @java metadata.graphics.util.MetadataFunctions
 */
export class MetadataFunctions {
  /**
   * Takes in the name of a region and returns an array of all sites in it.
   *
   * @param context    The runtime context (opaque reference).
   * @param regionName The name of the region.
   * @param roleType   The role of the owner (string mirror of Java RoleType; null for any).
   * @returns Array of site arrays per matching region.
   * @java MetadataFunctions.convertRegionToSiteArray(Context, String, RoleType)
   */
  static convertRegionToSiteArray(
    _context: unknown,
    _regionName: string,
    _roleType: string | null,
  ): number[][] {
    // GUI rendering hint — not evaluated in the engine.
    return [];
  }

  /**
   * Returns the real owner index for a given roletype.
   *
   * @param context  The runtime context (opaque reference).
   * @param roletype The roletype string.
   * @returns Player index.
   * @java MetadataFunctions.getRealOwner(Context, RoleType)
   */
  static getRealOwner(_context: unknown, _roletype: string): number {
    // GUI rendering hint — not evaluated in the engine.
    return 0;
  }

  private constructor() {
    // Static utility class — not instantiable.
  }
}
