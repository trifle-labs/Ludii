/**
 * ShowSitesIndex.ts
 *
 * @java metadata/graphics/show/sites/ShowSitesIndex.java
 *
 * Indicates whether the sites of the board should have their index displayed.
 */

/**
 * @java metadata.graphics.show.sites.ShowSitesIndex
 */
export class ShowSitesIndex {
  /** Site type (string mirror of Java SiteType enum). */
  readonly type: string;

  /** Additional value to add to the index. */
  readonly additionalValue: number;

  /**
   * @param type            Site type [Cell].
   * @param additionalValue Additional value to add to the index [0].
   * @java ShowSitesIndex(SiteType, Integer)
   */
  constructor(type: string | null, additionalValue: number | null) {
    this.type = type ?? "Cell";
    this.additionalValue = additionalValue ?? 0;
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
