// @java Common/src/main/collections/MapUtils.java

/**
 * Utility methods for maps
 *
 * @java main.collections.MapUtils
 * @author Dennis Soemers
 */
export class MapUtils {
  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @java MapUtils()
   */
  private constructor() {
    // Should not be used
  }

  // -------------------------------------------------------------------------

  /**
   * @param map
   * @param key Key to the slot that we want to add something to.
   * @param toAdd Value we want to add. If there is no value yet, we'll insert this.
   * @java MapUtils.add(Map<K, Double>, K, double)
   */
  public static add<K>(map: Map<K, number>, key: K, toAdd: number): void {
    if (!map.has(key))
      map.set(key, toAdd);
    else
      map.set(key, map.get(key)! + toAdd);
  }

  /**
   * Divides every value in this map by the given denominator
   * @java MapUtils.divide(Map<K, Double>, double)
   */
  public static divide<K>(map: Map<K, number>, denominator: number): void {
    for (const [key, value] of map.entries()) {
      map.set(key, value / denominator);
    }
  }

  // -------------------------------------------------------------------------
}
