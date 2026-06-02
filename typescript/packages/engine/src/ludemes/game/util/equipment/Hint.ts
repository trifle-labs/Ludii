// @java Core/src/game/util/equipment/Hint.java
//
// Defines a hint value assigned to a region or a specific site.
// Used only for deduction puzzles.

/**
 * Defines a hint value to a region or a specific site.
 * This is used only for deduction puzzles.
 *
 * @java game.util.equipment.Hint
 */
export class Hint {
  /** The hint value. @java Hint.hint */
  public readonly hint: number;

  /** The site indices in the region. @java Hint.region */
  public readonly region: readonly number[];

  /**
   * For creating a hint over a region.
   * @java Hint(Integer[] region, Integer? hint)
   *
   * @param region  The locations.
   * @param hint    The hint value (default 0).
   */
  public constructor(region: readonly number[], hint?: number);

  /**
   * For creating a hint at a single site.
   * @java Hint(Integer site, Integer? hint)
   *
   * @param site  The location.
   * @param hint  The hint value (default 0).
   */
  public constructor(site: number, hint?: number);

  public constructor(regionOrSite: readonly number[] | number, hint?: number) {
    this.hint = hint ?? 0;
    if (typeof regionOrSite === "number") {
      this.region = [regionOrSite];
    } else {
      this.region = regionOrSite;
    }
  }
}
