/**
 * Hint1to1.ts
 * @java game/util/equipment/Hint.java
 *
 * Defines a hint value to a region or a specific site.
 * Used only for deduction puzzles (slitherlink, sudoku, etc.).
 *
 * This is a data class — no eval(ctx).
 */

/**
 * Defines a hint value to a region or a specific site.
 * @java game/util/equipment/Hint.java
 * @remarks Used only for deduction puzzles.
 */
export class Hint1to1 {
  /**
   * @java Hint.hint — the hint value (default 0).
   */
  private readonly hintValue: number;

  /**
   * @java Hint.region — the location(s) of the hint.
   * One or more site indices.
   */
  private readonly regionSites: number[];

  /**
   * @java game/util/equipment/Hint.java — constructor(Integer[] region, Integer hint)
   * For creating hints in a region.
   */
  public constructor(sites: number[], hint = 0) {
    this.regionSites = sites;
    this.hintValue = hint;
  }

  /** @java Hint.hint() */
  public hint(): number {
    return this.hintValue;
  }

  /** @java Hint.region() */
  public region(): number[] {
    return this.regionSites;
  }
}
