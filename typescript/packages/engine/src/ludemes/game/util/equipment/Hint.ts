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
   * @java Hint(Integer[] region, @Opt Integer hint)
   * @java Hint(Integer site, @Opt Integer hint)
   */
  public constructor(regionOrSite: readonly number[] | number, hint?: number | null) {
    this.hint = hint == null ? 0 : hint;
    if (typeof regionOrSite === "number") {
      this.region = [regionOrSite];
    } else {
      this.region = regionOrSite;
    }
  }
}
